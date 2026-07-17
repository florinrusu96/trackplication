from unittest.mock import patch

from app.fetch import (
    extract_url,
    infer_source,
    is_safe_url,
    sanitize_jd_text,
)


# --- extract_url -------------------------------------------------------------

def test_extract_url_none_in_plain_text():
    assert extract_url("just a plain job description, no link") is None


def test_extract_url_finds_and_strips_trailing_punctuation():
    assert extract_url("see https://x.com/job.") == "https://x.com/job"
    assert extract_url("(https://x.com/job)") == "https://x.com/job"


def test_extract_url_first_when_text_and_url_mixed():
    text = "Backend role at Acme https://acme.com/careers/123 — apply soon"
    assert extract_url(text) == "https://acme.com/careers/123"


# --- is_safe_url -------------------------------------------------------------

def _addrinfo(ip: str):
    return [(None, None, None, "", (ip, 0))]


def test_is_safe_url_rejects_non_http_scheme():
    assert is_safe_url("file:///etc/passwd") is False
    assert is_safe_url("ftp://example.com/x") is False


def test_is_safe_url_allows_public_ip():
    with patch("app.fetch.socket.getaddrinfo", return_value=_addrinfo("93.184.216.34")):
        assert is_safe_url("https://example.com/job") is True


def test_is_safe_url_blocks_private_ip():
    with patch("app.fetch.socket.getaddrinfo", return_value=_addrinfo("10.0.0.5")):
        assert is_safe_url("https://internal.example.com") is False


def test_is_safe_url_blocks_metadata_ip_literal():
    # Numeric host resolves to itself offline — link-local, must be blocked.
    assert is_safe_url("http://169.254.169.254/latest/meta-data/") is False


def test_is_safe_url_blocks_loopback():
    with patch("app.fetch.socket.getaddrinfo", return_value=_addrinfo("127.0.0.1")):
        assert is_safe_url("http://localhost:8000") is False


def test_is_safe_url_rejects_unresolvable_host():
    import socket

    with patch("app.fetch.socket.getaddrinfo", side_effect=socket.gaierror):
        assert is_safe_url("https://nonexistent.invalid") is False


# --- sanitize_jd_text --------------------------------------------------------

def test_sanitize_strips_zero_width_chars():
    # 0x200B zero-width space, 0x200F RLM, 0x2060 word joiner, 0xFEFF BOM.
    dirty = (
        "Senior" + chr(0x200B) + "Engineer" + chr(0x200F)
        + " role" + chr(0x2060) + chr(0xFEFF)
    )
    assert sanitize_jd_text(dirty) == "SeniorEngineer role"


def test_sanitize_truncates_to_cap():
    assert len(sanitize_jd_text("x" * 50_000)) == 20_000


# --- infer_source ------------------------------------------------------------

def test_infer_source_known_domains():
    assert infer_source("https://www.linkedin.com/jobs/view/1") == "LinkedIn"
    assert infer_source("https://boards.greenhouse.io/acme/jobs/2") == "Greenhouse"
    assert infer_source("https://jobs.lever.co/acme/3") == "Lever"


def test_infer_source_unknown_domain():
    assert infer_source("https://careers.acme.com/123") is None
