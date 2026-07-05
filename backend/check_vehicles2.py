"""Inspect /api/v1/vehicles full response."""
import http.cookiejar
import json
import urllib.request
jar = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
req = urllib.request.Request(
    "http://localhost:8000/api/v1/auth/login",
    data=json.dumps({"email": "guard@unipark.ac.ke",
                    "password": "Guard@2026"}).encode(),
    method="POST",
    headers={"Content-Type": "application/json"},
)
opener.open(req).read()
cookies = {c.name: c.value for c in jar}
req = urllib.request.Request(
    "http://localhost:8000/api/v1/vehicles?limit=200",
    method="GET",
    headers={"X-CSRF-Token": cookies.get("csrf_token", "")},
)
body = opener.open(req).read().decode()
data = json.loads(body)
print(
    f"Got {len(data)} vehicle(s). Keys per record: {list(data[0].keys()) if data else 'none'}")
print("All fields for each:")
for v in data:
    print(json.dumps(v, indent=2))
