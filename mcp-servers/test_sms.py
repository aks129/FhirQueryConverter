#!/usr/bin/env python3
"""Quick test of Twilio SMS functionality using REST API directly"""

import urllib.request
import urllib.parse
import base64
import json
import sys

# Fix Windows console encoding
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Load credentials from environment variables
# Set these before running:
#   export TWILIO_ACCOUNT_SID=ACxxxx
#   export TWILIO_AUTH_TOKEN=xxxx
#   export TWILIO_FROM_NUMBER=+1xxxx
#   export TEST_PHONE_NUMBER=+1xxxx
import os
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM_NUMBER = os.environ.get("TWILIO_FROM_NUMBER", "")
YOUR_PHONE = os.environ.get("TEST_PHONE_NUMBER", "")

print("=" * 60)
print("[SMS] TESTING TWILIO SMS")
print("=" * 60)
print(f"From: {TWILIO_FROM_NUMBER}")
print(f"To: {YOUR_PHONE}")
print("=" * 60)

try:
    # Twilio API endpoint
    url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"

    # Message data
    data = urllib.parse.urlencode({
        'To': YOUR_PHONE,
        'From': TWILIO_FROM_NUMBER,
        'Body': 'Hi Maria! This is a test from the CQL to SQL demo. Your HbA1c screening is overdue. Please schedule an appointment. - Open Quality Care Team'
    }).encode('utf-8')

    # Basic auth header
    credentials = base64.b64encode(f"{TWILIO_ACCOUNT_SID}:{TWILIO_AUTH_TOKEN}".encode()).decode()

    # Create request
    request = urllib.request.Request(url, data=data)
    request.add_header('Authorization', f'Basic {credentials}')
    request.add_header('Content-Type', 'application/x-www-form-urlencoded')

    # Send request
    with urllib.request.urlopen(request) as response:
        result = json.loads(response.read().decode())

        print(f"\n[OK] SMS SENT SUCCESSFULLY!")
        print(f"   Message SID: {result.get('sid')}")
        print(f"   Status: {result.get('status')}")
        print(f"   To: {result.get('to')}")

except urllib.error.HTTPError as e:
    error_body = e.read().decode()
    print(f"\n[ERROR] HTTP ERROR {e.code}: {error_body}")
except Exception as e:
    print(f"\n[ERROR]: {e}")
