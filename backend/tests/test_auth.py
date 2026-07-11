def test_register_returns_token_and_user(client):
    res = client.post(
        "/api/auth/register",
        json={"email": "New@Example.com", "password": "password123"},
    )
    assert res.status_code == 201
    body = res.json()
    assert body["token"]
    assert body["user"]["email"] == "new@example.com"  # normalized to lowercase


def test_register_duplicate_email_409(client):
    payload = {"email": "dup@example.com", "password": "password123"}
    assert client.post("/api/auth/register", json=payload).status_code == 201
    assert client.post("/api/auth/register", json=payload).status_code == 409


def test_register_rejects_short_password(client):
    res = client.post(
        "/api/auth/register", json={"email": "x@example.com", "password": "short"}
    )
    assert res.status_code == 422


def test_register_rejects_bad_email(client):
    res = client.post(
        "/api/auth/register", json={"email": "not-an-email", "password": "password123"}
    )
    assert res.status_code == 422


def test_login_success_and_me(client):
    client.post(
        "/api/auth/register",
        json={"email": "login@example.com", "password": "password123"},
    )
    res = client.post(
        "/api/auth/login",
        json={"email": "login@example.com", "password": "password123"},
    )
    assert res.status_code == 200
    token = res.json()["token"]

    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "login@example.com"


def test_login_wrong_password_401(client):
    client.post(
        "/api/auth/register",
        json={"email": "wp@example.com", "password": "password123"},
    )
    res = client.post(
        "/api/auth/login", json={"email": "wp@example.com", "password": "nope"}
    )
    assert res.status_code == 401


def test_login_unknown_email_401(client):
    res = client.post(
        "/api/auth/login", json={"email": "ghost@example.com", "password": "password123"}
    )
    assert res.status_code == 401


def test_me_requires_token(client):
    assert client.get("/api/auth/me").status_code == 401
