from functools import lru_cache

import anthropic

from app.config import get_settings
from app.schemas import ExtractedApplication

SYSTEM_PROMPT = """\
You extract structured fields from a job posting (or a terse shorthand note like \
"add: Company X, Backend Engineer, saw it on LinkedIn").

Rules:
- Return company and role always; infer the most likely values if the text is terse.
- Use null for any field genuinely absent from the text — do not invent a location, \
salary, url, or source.
- salary_text is a human-readable display string exactly as written \
(e.g. "$185k–$220k"), not a parsed number.
- source is the site the posting came from. Infer from a URL or explicit mention: \
LinkedIn, Indeed, Company Site, Wellfound, Greenhouse, Lever. Null if not inferable.
- requirements: up to 6 short skill/qualification phrases (e.g. "Distributed systems", \
"Go or Rust"). Empty list if none are stated.
"""


@lru_cache
def _client() -> anthropic.Anthropic:
    # Pass the key only when configured; otherwise let the SDK resolve
    # credentials itself (ANTHROPIC_API_KEY env var or an `ant` profile).
    key = get_settings().anthropic_api_key
    return anthropic.Anthropic(api_key=key) if key else anthropic.Anthropic()


def extract_application(text: str) -> ExtractedApplication:
    """Call Claude to turn raw posting text into structured fields.

    Schema-enforced via messages.parse() — the response is validated against
    ExtractedApplication, so no hand-rolled JSON parsing. Raises on API failure;
    the route maps that to a 502.
    """
    settings = get_settings()
    response = _client().messages.parse(
        model=settings.anthropic_model,
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": text}],
        output_format=ExtractedApplication,
    )
    parsed = response.parsed_output
    if parsed is None:
        raise RuntimeError("Extraction returned no structured output")
    return parsed
