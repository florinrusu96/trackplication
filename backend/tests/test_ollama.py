from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from app.extraction import _extract_ollama, extract_application
from app.schemas import ExtractionResult


def test_extract_ollama_parses_schema_constrained_output():
    settings = SimpleNamespace(
        ollama_model="llama3.2", ollama_base_url="http://localhost:11434"
    )
    payload = ExtractionResult(
        is_job_posting=True,
        company="Acme",
        role="Backend Engineer",
        location="Remote",
        requirements=["Go"],
    ).model_dump_json()

    fake = MagicMock()
    fake.json.return_value = {"message": {"content": payload}}

    with patch("app.extraction.httpx.post", return_value=fake) as post:
        result = _extract_ollama("some jd text", settings)

    assert isinstance(result, ExtractionResult)
    assert result.company == "Acme"
    assert result.is_job_posting is True

    # Request goes to Ollama's chat endpoint, schema-constrained, deterministic.
    (url,), kwargs = post.call_args
    assert url == "http://localhost:11434/api/chat"
    body = kwargs["json"]
    assert body["model"] == "llama3.2"
    assert body["stream"] is False
    assert body["format"]["type"] == "object"  # ExtractionResult JSON schema
    assert body["options"]["temperature"] == 0


def test_extract_application_dispatches_by_provider():
    sentinel = ExtractionResult(is_job_posting=True, company="X", role="Y")
    with (
        patch(
            "app.extraction.get_settings",
            return_value=SimpleNamespace(extraction_provider="ollama"),
        ),
        patch("app.extraction._extract_ollama", return_value=sentinel) as ollama,
        patch("app.extraction._extract_anthropic") as anthropic_path,
    ):
        out = extract_application("text")

    assert out is sentinel
    ollama.assert_called_once()
    anthropic_path.assert_not_called()
