"""Fetch and clean a job posting from a user-supplied URL.

Security-critical: the server fetches arbitrary URLs a user pastes into chat,
so every fetch is guarded against SSRF (requests to internal/cloud-metadata
addresses) and the extracted text is sanitized before it reaches the model.
"""

import ipaddress
import re
import socket
from urllib.parse import urlparse

import httpx
import trafilatura

# Matches an http(s) URL anywhere in a chat message. Trailing punctuation is
# stripped by extract_url so "see https://x.com/job." doesn't capture the dot.
URL_RE = re.compile(r"https?://[^\s]+", re.IGNORECASE)

# Zero-width / bidirectional / word-joiner control characters — a hidden-
# instruction vector in fetched HTML. Built from ordinals so no invisible
# literal ends up in the source. Stripped before text is sent to the model.
_INVISIBLE_RANGES = (
    (0x200B, 0x200F),  # zero-width space, ZWNJ, ZWJ, LRM, RLM
    (0x202A, 0x202E),  # bidi embeddings / overrides
    (0x2060, 0x2064),  # word joiner, invisible operators
    (0xFEFF, 0xFEFF),  # BOM / zero-width no-break space
)
_INVISIBLE_RE = re.compile(
    "[" + "".join(f"\\U{lo:08x}-\\U{hi:08x}" for lo, hi in _INVISIBLE_RANGES) + "]"
)

_MAX_CHARS = 20_000
_MAX_BYTES = 3_000_000  # cap fetched body to avoid OOM on a hostile large response
_MAX_REDIRECTS = 3
_TIMEOUT = 10.0
_USER_AGENT = "Mozilla/5.0 (compatible; TrackplicationBot/1.0)"

# Ranges ipaddress doesn't flag but that can still reach internal infra in some
# cloud/container networks: carrier-grade NAT and benchmarking (RFC 2544).
_EXTRA_BLOCKED = (
    ipaddress.ip_network("100.64.0.0/10"),
    ipaddress.ip_network("198.18.0.0/15"),
)

_KNOWN_SOURCES = {
    "linkedin.com": "LinkedIn",
    "indeed.com": "Indeed",
    "greenhouse.io": "Greenhouse",
    "lever.co": "Lever",
    "wellfound.com": "Wellfound",
}


class FetchError(Exception):
    """Raised when a URL is unsafe or its content can't be read."""


def extract_url(text: str) -> str | None:
    """Return the first http(s) URL in text, or None. Strips trailing punctuation."""
    match = URL_RE.search(text)
    if not match:
        return None
    return match.group(0).rstrip(".,);]}'\"")


def is_safe_url(url: str) -> bool:
    """Block non-http schemes and any host resolving to a private/internal IP.

    Resolves DNS and checks EVERY resolved address, because a public hostname
    can resolve to a private IP (e.g. 169.254.169.254 cloud metadata, 127.0.0.1,
    RFC-1918 ranges). String inspection alone is insufficient.
    """
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        return False

    host = parsed.hostname
    if not host:
        return False

    try:
        infos = socket.getaddrinfo(host, None)
    except socket.gaierror:
        return False

    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_reserved
            or ip.is_multicast
            or ip.is_unspecified
        ):
            return False
        if ip.version == 4 and any(ip in net for net in _EXTRA_BLOCKED):
            return False

    return True


def _get_html(url: str) -> str:
    """GET the URL with redirects disabled, re-validating each hop.

    trafilatura.fetch_url does its own uncontrolled fetch and would follow a
    redirect straight to a private IP, defeating is_safe_url. We follow manually
    so every redirect target is re-checked.

    Known low-priority gap (v1): TOCTOU / DNS-rebinding — the host is re-resolved
    on the actual connection and could differ from the validated resolution.
    Pinning the validated IP into the connection is out of scope for v1.
    """
    headers = {"User-Agent": _USER_AGENT}
    with httpx.Client(follow_redirects=False, timeout=_TIMEOUT) as http:
        for _ in range(_MAX_REDIRECTS + 1):
            if not is_safe_url(url):
                raise FetchError("URL resolves to a blocked address")
            # Stream so we never hold more than _MAX_BYTES in memory — a hostile
            # URL could otherwise return a multi-GB body and OOM the worker.
            with http.stream("GET", url, headers=headers) as resp:
                if resp.is_redirect:
                    location = resp.headers.get("location")
                    if not location:
                        raise FetchError("Redirect without a location")
                    url = str(resp.url.join(location))
                    continue
                resp.raise_for_status()
                declared = resp.headers.get("content-length")
                if declared and declared.isdigit() and int(declared) > _MAX_BYTES:
                    raise FetchError("Response too large")
                chunks: list[bytes] = []
                total = 0
                for chunk in resp.iter_bytes():
                    total += len(chunk)
                    if total > _MAX_BYTES:
                        raise FetchError("Response too large")
                    chunks.append(chunk)
                return b"".join(chunks).decode(resp.encoding or "utf-8", errors="replace")
    raise FetchError("Too many redirects")


def fetch_jd_text(url: str) -> str:
    """Fetch url, extract the main content, and return clean text.

    Raises FetchError on an unsafe URL, a network failure, or when no meaningful
    content can be extracted (e.g. a login wall or JS-only shell).
    """
    if not is_safe_url(url):
        raise FetchError("URL resolves to a blocked address")
    try:
        html = _get_html(url)
    except httpx.HTTPError as exc:
        raise FetchError(f"Could not fetch URL: {exc}") from exc

    text = trafilatura.extract(html)
    if not text or not text.strip():
        raise FetchError("No readable content at URL")
    return text


def sanitize_jd_text(text: str) -> str:
    """Strip invisible/bidi control chars and cap length before sending to the model."""
    cleaned = _INVISIBLE_RE.sub("", text)
    return cleaned[:_MAX_CHARS]


def infer_source(url: str) -> str | None:
    """Map a URL's domain to a known job-board source label, else None."""
    host = (urlparse(url).hostname or "").lower()
    for domain, label in _KNOWN_SOURCES.items():
        if host == domain or host.endswith("." + domain):
            return label
    return None
