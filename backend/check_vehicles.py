"""Check what GET /api/v1/vehicles returns."""
import http.cookiejar
import json
import urllib.request
from urllib.error import HTTPError

BASE = "http://localhost:8000/api/v1"


def make_request(method, path, payload=None, jar=None, csrf=None):
    url = f"{BASE}{path}"
    data = None
    headers = {"Accept": "application/json"}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"
    if csrf:
        headers["X-CSRF-Token"] = csrf
    req = urllib.request.Request(
        url, data=data, method=method, headers=headers)
    opener = urllib.request.build_opener(
        urllib.request.HTTPCookieProcessor(jar))
    try:
        resp = opener.open(req)
        return resp.status, resp.read().decode("utf-8"), jar
    except HTTPError as e:
        return e.code, e.read().decode("utf-8"), jar


jar = http.cookiejar.CookieJar()
status, body, jar = make_request(
    "POST", "/auth/login",
    payload={"email": "guard@unipark.ac.ke", "password": "Guard@2026"},
    jar=jar,
)
print(f"Login: HTTP {status}")

status, body, _ = make_request("GET", "/vehicles?limit=200", jar=jar)
print(f"\nVehicles endpoint: HTTP {status}")
data = json.loads(body)
print(f"Returned {len(data)} vehicle(s)")
for v in data[:5]:
    print("  ", v)
print("...searching for ABC123...")
for v in data:
    if (v.get("registration_number") or "").upper() == "ABC123":
        print("  MATCH:", v)
        break
else:
    print("  NO MATCH")
