#!/usr/bin/env python3
"""Confirm the App Store Connect API key can authenticate before spending
several minutes on an xcodebuild archive that would fail anyway.

xcodebuild's own error for a rejected key is a bare 401 on an internal
endpoint with no explanation — exactly what showed up the first time this
pipeline ran a real archive. Calling Apple's API directly first surfaces
their actual JSON error, which distinguishes "these three values don't
belong to the same key" from "right key, missing Developer Portal access" —
two different problems that otherwise look identical.

Reads KEY_ID, ISSUER_ID and KEY_PATH from the environment, set by the
workflow's "Install the App Store Connect API key" step.
"""

import os
import sys
import time
import urllib.error
import urllib.request

import jwt


def main() -> int:
    key_id = os.environ["KEY_ID"]
    issuer_id = os.environ["ISSUER_ID"]
    with open(os.environ["KEY_PATH"], encoding="utf-8") as f:
        private_key = f.read()

    now = int(time.time())
    token = jwt.encode(
        {"iss": issuer_id, "iat": now, "exp": now + 600, "aud": "appstoreconnect-v1"},
        private_key,
        algorithm="ES256",
        headers={"kid": key_id, "typ": "JWT"},
    )

    request = urllib.request.Request(
        "https://api.appstoreconnect.apple.com/v1/apps?limit=1",
        headers={"Authorization": f"Bearer {token}"},
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            print(f"App Store Connect accepted the key (HTTP {response.status}).")
            return 0
    except urllib.error.HTTPError as error:
        print(f"::error::App Store Connect rejected the API key: HTTP {error.code}")
        print(error.read().decode("utf-8", "replace"))
        if error.code == 401:
            print(
                "::error::A 401 here means ASC_KEY_ID, ASC_ISSUER_ID and "
                "ASC_PRIVATE_KEY don't all come from the same key, or the key "
                "doesn't have Developer Portal access. Create a new key with "
                "the Admin role in App Store Connect and update all three "
                "secrets from it together — see the iOS section of the README."
            )
        return 1
    except OSError as error:
        print(f"::error::Could not reach App Store Connect: {error}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
