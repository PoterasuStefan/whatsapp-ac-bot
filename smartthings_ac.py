#!/usr/bin/env python3
"""
Control interactiv aer condiționat prin SmartThings API
"""

import urllib.request
import urllib.error
import json
import ssl

try:
    import certifi
    ssl_context = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

API_KEY = "5b3f7cc2-df5d-49c5-9666-70bde565c5d6"
BASE_URL = "https://api.smartthings.com/v1"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def make_request(endpoint, method="GET", body=None):
    url = f"{BASE_URL}{endpoint}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, headers=HEADERS, data=data, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10, context=ssl_context) as response:
            raw = response.read().decode()
            return response.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        return e.code, json.loads(raw) if raw else {"error": e.reason}
    except urllib.error.URLError as e:
        return None, {"error": str(e.reason)}

def get_ac_devices():
    status, data = make_request("/devices")
    if status != 200:
        return []
    devices = []
    for device in data.get("items", []):
        components = device.get("components", [])
        for comp in components:
            for cap in comp.get("capabilities", []):
                if cap.get("id") in ["airConditionerMode", "thermostatCoolingSetpoint"]:
                    devices.append({
                        "name": device.get("label") or device.get("name"),
                        "id": device.get("deviceId")
                    })
                    break
    return devices

def get_ac_status(device_id):
    status, data = make_request(f"/devices/{device_id}/status")
    if status != 200:
        return None
    main = data.get("components", {}).get("main", {})
    switch = main.get("switch", {}).get("switch", {}).get("value", "unknown")
    temp = main.get("temperatureMeasurement", {}).get("temperature", {})
    temp_val = f"{temp.get('value')}°{temp.get('unit', 'C')}" if temp.get("value") is not None else "N/A"
    mode = main.get("airConditionerMode", {}).get("airConditionerMode", {}).get("value", "N/A")
    cooling_sp = main.get("thermostatCoolingSetpoint", {}).get("coolingSetpoint", {})
    setpoint = f"{cooling_sp.get('value')}°{cooling_sp.get('unit', 'C')}" if cooling_sp.get("value") is not None else "N/A"
    return {
        "switch": switch,
        "temperature": temp_val,
        "mode": mode,
        "setpoint": setpoint
    }

def send_command(device_id, capability, command, args=None):
    body = {
        "commands": [{
            "component": "main",
            "capability": capability,
            "command": command,
            "arguments": args or []
        }]
    }
    status, data = make_request(f"/devices/{device_id}/commands", method="POST", body=body)
    return status in (200, 202)

def print_status(st):
    icon = "🟢 PORNIT" if st["switch"] == "on" else "🔴 OPRIT"
    print(f"\n  Stare:       {icon}")
    print(f"  Temperatură: {st['temperature']}")
    print(f"  Mod:         {st['mode']}")
    print(f"  Setpoint:    {st['setpoint']}")


def main():
    import sys

    devices = get_ac_devices()
    if not devices:
        print("ERROR: Nu s-a gasit niciun dispozitiv AC.")
        sys.exit(1)

    device = devices[0]

    if len(sys.argv) > 1:
        # Mod automat: python3 smartthings_ac.py on/off
        cmd = sys.argv[1].lower()
        if cmd == 'on':
            success = send_command(device["id"], "switch", "on")
            print("SUCCESS: AC pornit." if success else "ERROR: Comanda esuata.")
        elif cmd == 'off':
            success = send_command(device["id"], "switch", "off")
            print("SUCCESS: AC oprit." if success else "ERROR: Comanda esuata.")
        else:
            print(f"ERROR: Comanda necunoscuta: {cmd}")
        sys.exit(0)
if __name__ == "__main__":
    main()