SAMPLE = {
    "company": "Stripe",
    "role": "Senior Backend Engineer",
    "location": "Remote (US)",
    "salary_text": "$185k–$220k",
    "source": "LinkedIn",
    "url": "https://example.com/job/1",
    "requirements": ["Distributed systems", "Go or Rust"],
}


def test_health_no_auth(client):
    assert client.get("/api/health").json() == {"status": "ok"}


def test_auth_required(client):
    assert client.get("/api/applications").status_code == 401
    assert (
        client.get("/api/applications", headers={"X-API-Key": "wrong"}).status_code
        == 401
    )


def test_create_list_patch_delete(client, auth):
    created = client.post("/api/applications", json=SAMPLE, headers=auth)
    assert created.status_code == 201
    body = created.json()
    app_id = body["id"]
    assert body["company"] == "Stripe"
    assert body["status"] == "Applied"
    assert body["notes"] == ""

    listed = client.get("/api/applications", headers=auth).json()
    assert len(listed) == 1
    assert listed[0]["id"] == app_id

    patched = client.patch(
        f"/api/applications/{app_id}",
        json={"status": "Interviewing", "notes": "Recruiter screen went well"},
        headers=auth,
    ).json()
    assert patched["status"] == "Interviewing"
    assert patched["notes"] == "Recruiter screen went well"
    assert patched["company"] == "Stripe"  # untouched

    assert (
        client.delete(f"/api/applications/{app_id}", headers=auth).status_code == 204
    )
    assert client.get("/api/applications", headers=auth).json() == []


def test_patch_missing_404(client, auth):
    r = client.patch(
        "/api/applications/00000000-0000-0000-0000-000000000000",
        json={"status": "Offer"},
        headers=auth,
    )
    assert r.status_code == 404


def test_create_defaults_and_nullable(client, auth):
    minimal = {"company": "Acme", "role": "Backend Engineer"}
    body = client.post("/api/applications", json=minimal, headers=auth).json()
    assert body["location"] is None
    assert body["salary_text"] is None
    assert body["requirements"] == []
    assert body["status"] == "Applied"


def test_invalid_status_rejected(client, auth):
    bad = {**SAMPLE, "status": "Pending"}
    assert client.post("/api/applications", json=bad, headers=auth).status_code == 422
