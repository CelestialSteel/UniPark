"""Inspect driver-by-admission response shape (admission id)."""
import http.cookiejar
import json
import urllib.request
import psycopg

jar = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))


def post(path, payload):
    cookies = {c.name: c.value for c in jar}
    req = urllib.request.Request(
        f"http://localhost:8000{path}",
        data=json.dumps(payload).encode(),
        method="POST",
        headers={
            "Content-Type": "application/json",
            "X-CSRF-Token": cookies.get("csrf_token", ""),
        },
    )
    return opener.open(req).read().decode()


post("/api/v1/auth/login",
     {"email": "guard@unipark.ac.ke", "password": "Guard@2026"})

c = psycopg.connect(
    "host=localhost dbname=unipark_db user=moran password=Psql2345")
cur = c.cursor()
cur.execute("SELECT student_id FROM drivers WHERE student_id IS NOT NULL LIMIT 1")
admission = cur.fetchone()[0]
print(f"Trying admission: {admission}")

cookies = {c.name: c.value for c in jar}
req = urllib.request.Request(
    f"http://localhost:8000/api/v1/drivers/by-admission/{admission}",
    method="GET",
    headers={"X-CSRF-Token": cookies.get("csrf_token", "")},
)
body = opener.open(req).read().decode()
print(body[:1500])
