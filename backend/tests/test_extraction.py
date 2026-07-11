from unittest.mock import patch

from app.schemas import ExtractedApplication


def test_extract_endpoint_maps_parsed_output(client, auth):
    fake = ExtractedApplication(
        company="Datadog",
        role="Backend Engineer II",
        location="New York, NY",
        salary_text=None,
        source="Indeed",
        url=None,
        requirements=["Java/Kotlin", "Kafka"],
    )
    with patch("app.routes.extract_application", return_value=fake):
        r = client.post("/api/extract", json={"text": "some posting"}, headers=auth)
    assert r.status_code == 200
    body = r.json()
    assert body["company"] == "Datadog"
    assert body["salary_text"] is None
    assert body["requirements"] == ["Java/Kotlin", "Kafka"]


def test_extract_empty_text_422(client, auth):
    assert (
        client.post("/api/extract", json={"text": ""}, headers=auth).status_code == 422
    )


def test_extract_failure_maps_to_502(client, auth):
    with patch("app.routes.extract_application", side_effect=RuntimeError("boom")):
        r = client.post("/api/extract", json={"text": "x"}, headers=auth)
    assert r.status_code == 502
    assert "boom" in r.json()["detail"]


def test_extract_requires_auth(client):
    assert client.post("/api/extract", json={"text": "x"}).status_code == 401
