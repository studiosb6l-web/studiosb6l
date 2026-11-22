#!/usr/bin/env python3
"""Offline fail-closed audit of artist submission launch prerequisites.

Does not call Cloudflare, deploy resources, or read production secrets.
"""
from pathlib import Path
import re
import sys

root = Path(__file__).resolve().parents[1]
errors = []
backend = root / "artist-backend"
wrangler = backend / "wrangler.toml"
readme = backend / "README.md"

for path in (wrangler, readme, root / "assets/artist-track-submit.js"):
    if not path.is_file():
        errors.append(f"Required file missing: {path.relative_to(root)}")

if wrangler.is_file():
    config = wrangler.read_text(encoding="utf-8")
    if "REPLACE_WITH_YOUR_KV_NAMESPACE_ID" in config:
        errors.append("KV namespace is a placeholder; private artist intake is not deploy-ready")
    if not re.search(r"(?m)^\s*\[\[r2_buckets\]\]", config):
        errors.append("No R2 bucket binding declared in wrangler.toml")
    if not re.search(r"(?m)^\s*\[\[kv_namespaces\]\]", config):
        errors.append("No KV namespace binding declared in wrangler.toml")

if readme.is_file():
    instructions = readme.read_text(encoding="utf-8")
    if "ADMIN_TOKEN" not in instructions:
        errors.append("Admin secret setup is undocumented")

print("STUDIOSB6L artist intake offline readiness audit")
if errors:
    for error in errors:
        print("BLOCKER:", error)
    print("NOT READY: No claim of production upload readiness is permitted.")
    sys.exit(1)
print("Static prerequisites found. Live bindings, authorization, R2 privacy, quotas, and end-to-end uploads still require separate verification.")
