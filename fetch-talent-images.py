#!/usr/bin/env python3
# Fetches og:image for each unique talent entity and writes data/sxm_talent_reference.csv
# Usage: python3 fetch-talent-images.py
# Rate: 10 concurrent requests, ~120s total for 1187 entities

import asyncio, csv, re, base64, json, sys, time
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
from concurrent.futures import ThreadPoolExecutor

BASE_URL = "https://www.siriusxm.com/player/talent/entity/"
OG_IMAGE_RE = re.compile(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\'](https://imgsrv-sxm-prod-device\.streaming\.siriusxm\.com/[^"\']+)["\']', re.IGNORECASE)
OG_IMAGE_RE2 = re.compile(r'<meta[^>]+content=["\'](https://imgsrv-sxm-prod-device\.streaming\.siriusxm\.com/[^"\']+)["\'][^>]+property=["\']og:image["\']', re.IGNORECASE)

def build_cdn_url(aem_key: str, width=600, height=600) -> str:
    j = json.dumps(
        {"key": aem_key, "edits": [{"format": {"type": "jpeg"}}, {"resize": {"width": width, "height": height}}]},
        separators=(",", ":")
    )
    return "https://imgsrv-sxm-prod-device.streaming.siriusxm.com/" + base64.b64encode(j.encode()).decode()

def name_to_slug(name: str) -> str:
    import re as _re
    slug = name.lower().strip()
    slug = _re.sub(r"['\u2018\u2019]", "", slug)   # strip apostrophes
    slug = _re.sub(r"[^a-z0-9]+", "-", slug)        # non-alphanumeric → hyphen
    slug = slug.strip("-")
    return slug

def fetch_talent(entity_id: str, name: str) -> dict:
    url = BASE_URL + entity_id
    try:
        req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urlopen(req, timeout=10) as resp:
            html = resp.read().decode("utf-8", errors="replace")
    except (URLError, HTTPError) as e:
        return {"talent_entity_id": entity_id, "talent_name": name,
                "talent_slug": name_to_slug(name),
                "talent_image_url": "", "player_landing_page": url,
                "_error": str(e)}

    # Extract og:image
    m = OG_IMAGE_RE.search(html) or OG_IMAGE_RE2.search(html)
    if m:
        og_url = m.group(1)
        # Decode base64 to get AEM key, rebuild at 600x600
        try:
            b64part = og_url.split("/")[-1]
            decoded = json.loads(base64.b64decode(b64part + "=="))
            aem_key = decoded.get("key", "")
            image_url = build_cdn_url(aem_key) if aem_key else og_url
        except Exception:
            image_url = og_url  # fallback: use og:image as-is
    else:
        image_url = ""

    return {
        "talent_entity_id": entity_id,
        "talent_name": name,
        "talent_slug": name_to_slug(name),
        "talent_image_url": image_url,
        "player_landing_page": url,
        "_error": "",
    }

def main():
    # Load unique talents preserving first-seen talent_type
    seen = {}
    with open("data/sxm_talent_content_relationship_ref.csv") as f:
        for r in csv.DictReader(f):
            eid = r["talent_entity_id"]
            if eid not in seen:
                seen[eid] = r["talent_name"]

    talents = list(seen.items())
    total = len(talents)
    print(f"Fetching images for {total} unique talent entities...")

    results = []
    errors = []
    done = 0
    t0 = time.time()

    with ThreadPoolExecutor(max_workers=10) as pool:
        futures = {pool.submit(fetch_talent, eid, name): (eid, name) for eid, name in talents}
        for future in futures:
            result = future.result()
            results.append(result)
            done += 1
            if result["_error"]:
                errors.append(result)
            if done % 50 == 0 or done == total:
                elapsed = time.time() - t0
                pct = done / total * 100
                print(f"  {done}/{total} ({pct:.0f}%) — {elapsed:.0f}s elapsed", flush=True)

    # Write output CSV
    out_path = "data/sxm_talent_reference.csv"
    fieldnames = ["talent_entity_id", "talent_name", "talent_slug", "talent_image_url", "player_landing_page"]
    results.sort(key=lambda r: r["talent_name"])
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(results)

    elapsed = time.time() - t0
    found = sum(1 for r in results if r["talent_image_url"])
    print(f"\nDone in {elapsed:.0f}s")
    print(f"  {found}/{total} image URLs found")
    print(f"  {len(errors)} errors")
    if errors:
        print("  Errors:")
        for e in errors[:10]:
            print(f"    {e['talent_name']} ({e['talent_entity_id']}): {e['_error']}")
    print(f"  Written: {out_path}")

if __name__ == "__main__":
    main()
