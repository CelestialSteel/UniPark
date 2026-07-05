"""End-to-end test for the security dashboard's entry/exit flow."""

import http.cookiejar
import json
import sys
import urllib.request
from urllib.error import HTTPError

BASE = "http://localhost:8000/api/v1"
ZONE_ID = "6c62e585-ff82-43f6-967c-be86d8e3595a"  # Phase 1
PLATE = "ABC123"


def make_request(method, path, payload=None, jar=None, csrf=None):
    url = f"{BASE}{path}"
    data = None
    headers = {"Accept": "application/json"}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"
    if csrf:
        headers["X-CSRF-Token"] = csrf
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    try:
        resp = opener.open(req)
        return resp.status, resp.read().decode("utf-8"), jar
    except HTTPError as e:
        return e.code, e.read().decode("utf-8"), jar


def main():
    jar = http.cookiejar.CookieJar()

    # 1. Login as the security guard
    status, body, jar = make_request(
        "POST", "/auth/login",
        payload={"email": "guard@unipark.ac.ke", "password": "Guard@2026"},
        jar=jar,
    )
    print(f"Login: HTTP {status}")
    if status != 200:
        print("  body:", body)
        return 1
    cookies = {c.name: c.value for c in jar}
    print(f"  cookies: {sorted(cookies.keys())}")

    # 2. Log vehicle ABC123 into Phase 1
    status, body, jar = make_request(
        "POST", "/logs/entry",
        payload={"registration_number": PLATE, "parking_zone_id": ZONE_ID},
        jar=jar, csrf=cookies.get("csrf_token"),
    )
    print(f"\nEntry: HTTP {status}")
    if status != 201:
        print("  body:", body)
        return 1
    entry = json.loads(body)
    print(f"  log id         : {entry['id']}")
    print(f"  status         : {entry['status']}")
    print(f"  plate          : {entry['vehicle_registration']}")
    print(f"  zone           : {entry['parking_zone_name']} ({entry['parking_zone_code']})")
    print(f"  entry_time     : {entry['entry_time']}")

    # 3. Check zone occupancy
    status, body, _ = make_request("GET", "/zones/occupancy", jar=jar)
    occ = [z for z in json.loads(body) if z["zone_name"] == "Phase 1"][0]
    print(f"\nPhase 1 after entry: {occ['occupied_spaces']}/{occ['total_spaces']}")

    # 4. List active logs
    status, body, _ = make_request("GET", "/logs/active", jar=jar)
    active = json.loads(body)
    print(f"\nActive logs: {len(active)}")
    for log in active:
        print(f"  - {log['vehicle_registration']:10} @ {log['parking_zone_name']:25} entered at {log['entry_time']}")

    # 5. Log the same vehicle out
    status, body, jar = make_request(
        "POST", "/logs/exit",
        payload={"registration_number": PLATE},
        jar=jar, csrf=cookies.get("csrf_token"),
    )
    print(f"\nExit: HTTP {status}")
    if status != 200:
        print("  body:", body)
        return 1
    exit_log = json.loads(body)
    print(f"  status         : {exit_log['status']}")
    print(f"  exit_time      : {exit_log['exit_time']}")
    print(f"  duration (min) : {exit_log['duration_minutes']}")

    # 6. Check zone occupancy again
    status, body, _ = make_request("GET", "/zones/occupancy", jar=jar)
    occ2 = [z for z in json.loads(body) if z["zone_name"] == "Phase 1"][0]
    print(f"\nPhase 1 after exit: {occ2['occupied_spaces']}/{occ2['total_spaces']}")

    # 7. Test the visitor flow
    print("\n--- Visitor flow ---")
    status, body, jar = make_request(
        "POST", "/logs/entry",
        payload={
            "guest_registration": "TST 999X",
            "guest_name": "Sharon Wambui",
            "guest_group": "Conference/Event",
            "parking_zone_id": ZONE_ID,
        },
        jar=jar, csrf=cookies.get("csrf_token"),
    )
    print(f"Visitor entry: HTTP {status}")
    if status != 201:
        print("  body:", body)
        return 1
    v = json.loads(body)
    print(f"  log id       : {v['id']}")
    print(f"  guest_plate  : {v['guest_registration']}")
    print(f"  guest_name   : {v['guest_name']}")
    print(f"  guest_group  : {v['guest_group']}")

    status, body, _ = make_request("GET", "/zones/occupancy", jar=jar)
    occ3 = [z for z in json.loads(body) if z["zone_name"] == "Phase 1"][0]
    print(f"\nPhase 1 after visitor entry: {occ3['occupied_spaces']}/{occ3['total_spaces']}")

    # 8. Visitor exit
    status, body, jar = make_request(
        "POST", "/logs/exit",
        payload={"guest_registration": "TST 999X"},
        jar=jar, csrf=cookies.get("csrf_token"),
    )
    print(f"\nVisitor exit: HTTP {status}")
    if status != 200:
        print("  body:", body)
        return 1
    v = json.loads(body)
    print(f"  guest_plate : {v['guest_registration']}")
    print(f"  status      : {v['status']}")

    status, body, _ = make_request("GET", "/zones/occupancy", jar=jar)
    occ4 = [z for z in json.loads(body) if z["zone_name"] == "Phase 1"][0]
    print(f"\nPhase 1 after visitor exit: {occ4['occupied_spaces']}/{occ4['total_spaces']}")

    print("\nAll assertions passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
