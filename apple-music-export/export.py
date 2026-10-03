#!/usr/bin/env python3
"""Apple Music 플레이리스트 → 플레이리스트별 MD + 통합 CSV.

원본은 읽기만 한다(파일은 읽기 전용으로 열고, API는 GET만 호출).

사용법
  python3 export.py xml  Library.xml              # 음악/iTunes '보관함 내보내기' 파일
  python3 export.py url  <링크 또는 저장한 .html>...  # 공개 플레이리스트 링크
  python3 export.py api                           # Apple Music API (전체 보관함, URL·ISRC 포함)
      필요 환경변수: APPLE_MUSIC_DEV_TOKEN, APPLE_MUSIC_USER_TOKEN

공통 옵션: -o/--out 출력 폴더 (기본 ./output)
"""
import argparse
import csv
import html
import json
import os
import plistlib
import re
import sys
import urllib.parse
import urllib.request

FIELDS = ["playlist", "position", "title", "artist", "album", "url", "isrc"]
API_BASE = os.environ.get("APPLE_MUSIC_API_BASE", "https://api.music.apple.com")


# ---------- 입력 1: Library.xml ----------

def from_library_xml(path):
    with open(path, "rb") as f:
        lib = plistlib.load(f)
    tracks = lib.get("Tracks", {})
    playlists = []
    for pl in lib.get("Playlists", []):
        # 전체 보관함·음악·팟캐스트 같은 시스템 목록과 폴더는 건너뛴다
        if pl.get("Master") or pl.get("Distinguished Kind") or pl.get("Folder"):
            continue
        rows = []
        for item in pl.get("Playlist Items", []):
            t = tracks.get(str(item.get("Track ID")), {})
            rows.append({
                "title": t.get("Name", ""),
                "artist": t.get("Artist", ""),
                "album": t.get("Album", ""),
                "url": t.get("Location", "") if str(t.get("Location", "")).startswith("http") else "",
                "isrc": "",
            })
        playlists.append((pl.get("Name", "(이름 없음)"), rows))
    return playlists


# ---------- 입력 2: 공개 플레이리스트 링크 / 저장한 HTML ----------

def _fetch(src):
    if os.path.exists(src):
        with open(src, encoding="utf-8") as f:
            return f.read()
    req = urllib.request.Request(src, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "replace")


def _artist_names(v):
    if isinstance(v, list):
        return ", ".join(filter(None, (_artist_names(x) for x in v)))
    if isinstance(v, dict):
        return v.get("name", "")
    return v or ""


def from_public_page(src):
    page = _fetch(src)
    name, rows = None, []

    # 1순위: JSON-LD (MusicPlaylist)
    for block in re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', page, re.S):
        try:
            data = json.loads(html.unescape(block))
        except ValueError:
            continue
        for d in data if isinstance(data, list) else [data]:
            if d.get("@type") != "MusicPlaylist":
                continue
            name = d.get("name")
            for t in d.get("track", []):
                album = t.get("inAlbum") or {}
                rows.append({
                    "title": t.get("name", ""),
                    "artist": _artist_names(t.get("byArtist")),
                    "album": album.get("name", "") if isinstance(album, dict) else "",
                    "url": t.get("url", ""),
                    "isrc": t.get("isrcCode", ""),
                })

    # 2순위: 페이지에 내장된 serialized-server-data (아티스트·앨범 보강)
    m = re.search(r'<script[^>]*id="serialized-server-data"[^>]*>(.*?)</script>', page, re.S)
    if m:
        try:
            items = list(_walk_track_items(json.loads(html.unescape(m.group(1)))))
        except ValueError:
            items = []
        if items and (not rows or len(items) == len(rows)):
            if not rows:
                rows = [{"title": "", "artist": "", "album": "", "url": "", "isrc": ""} for _ in items]
            for r, it in zip(rows, items):
                for k in ("title", "artist", "album", "url"):
                    r[k] = r[k] or it.get(k, "")

    if name is None:
        t = re.search(r'<meta[^>]*property="og:title"[^>]*content="([^"]*)"', page)
        name = html.unescape(t.group(1)) if t else src
    if not rows:
        print(f"경고: 곡 목록을 찾지 못함 → {src}", file=sys.stderr)
    return name, rows


def _walk_track_items(node):
    """serialized-server-data 안의 트랙 아이템(title + artistName)을 순서대로 찾는다."""
    if isinstance(node, dict):
        if node.get("title") and "artistName" in node and (
                node.get("contentDescriptor", {}).get("kind") == "song" or "trackNumber" in node or "albumName" in node):
            yield {
                "title": node.get("title", ""),
                "artist": node.get("artistName", ""),
                "album": node.get("albumName", "") or (node.get("tertiaryLinks") or [{}])[0].get("title", ""),
                "url": node.get("contentDescriptor", {}).get("url", ""),
            }
            return
        for v in node.values():
            yield from _walk_track_items(v)
    elif isinstance(node, list):
        for v in node:
            yield from _walk_track_items(v)


# ---------- 입력 3: Apple Music API ----------

def _api_get(path, dev, user):
    url = path if path.startswith("http") else API_BASE + path
    req = urllib.request.Request(url, method="GET", headers={
        "Authorization": f"Bearer {dev}", "Music-User-Token": user})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def _api_all(path, dev, user):
    out = []
    while path:
        page = _api_get(path, dev, user)
        out += page.get("data", [])
        path = page.get("next")
    return out


def from_api():
    dev, user = os.environ.get("APPLE_MUSIC_DEV_TOKEN"), os.environ.get("APPLE_MUSIC_USER_TOKEN")
    if not dev or not user:
        sys.exit("APPLE_MUSIC_DEV_TOKEN, APPLE_MUSIC_USER_TOKEN 환경변수가 필요합니다.")
    storefront = _api_get("/v1/me/storefront", dev, user)["data"][0]["id"]

    playlists = []
    for pl in _api_all("/v1/me/library/playlists?limit=100", dev, user):
        songs = _api_all(f"/v1/me/library/playlists/{pl['id']}/tracks?limit=100", dev, user)
        playlists.append((pl["attributes"].get("name", "(이름 없음)"), songs))

    # 카탈로그 ID로 URL·ISRC 일괄 조회 (요청당 최대 300곡)
    ids = sorted({s["attributes"].get("playParams", {}).get("catalogId")
                  for _, songs in playlists for s in songs} - {None})
    catalog = {}
    for i in range(0, len(ids), 300):
        q = urllib.parse.quote(",".join(ids[i:i + 300]))
        for c in _api_get(f"/v1/catalog/{storefront}/songs?ids={q}", dev, user).get("data", []):
            catalog[c["id"]] = c["attributes"]

    result = []
    for name, songs in playlists:
        rows = []
        for s in songs:
            a = s["attributes"]
            c = catalog.get(a.get("playParams", {}).get("catalogId"), {})
            rows.append({
                "title": a.get("name", ""),
                "artist": a.get("artistName", ""),
                "album": a.get("albumName", ""),
                "url": c.get("url", ""),
                "isrc": c.get("isrc", ""),
            })
        result.append((name, rows))
    return result


# ---------- 출력 ----------

def _safe_filename(name):
    name = re.sub(r'[\\/:*?"<>|\x00-\x1f]', "_", name).strip(" .")
    return name[:80] or "untitled"


def _md_cell(v):
    return str(v).replace("|", "\\|").replace("\n", " ")


def write_outputs(playlists, out_dir):
    pl_dir = os.path.join(out_dir, "playlists")
    os.makedirs(pl_dir, exist_ok=True)
    all_rows = []
    width = len(str(len(playlists)))
    for idx, (name, rows) in enumerate(playlists, 1):
        lines = [f"# {name}", "", f"- 곡 수: {len(rows)}", "",
                 "| # | 곡명 | 아티스트 | 앨범 | URL | ISRC |",
                 "|---:|---|---|---|---|---|"]
        for pos, r in enumerate(rows, 1):
            url = f"[링크]({r['url']})" if r["url"] else ""
            lines.append("| " + " | ".join(_md_cell(v) for v in
                         (pos, r["title"], r["artist"], r["album"], url, r["isrc"])) + " |")
            all_rows.append({"playlist": name, "position": pos, **{k: r[k] for k in FIELDS[2:]}})
        path = os.path.join(pl_dir, f"{idx:0{width}d}_{_safe_filename(name)}.md")
        with open(path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")

    # utf-8-sig: 엑셀에서 한글이 깨지지 않도록 BOM 포함
    with open(os.path.join(out_dir, "all_playlists.csv"), "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        w.writeheader()
        w.writerows(all_rows)
    print(f"플레이리스트 {len(playlists)}개, 곡 {len(all_rows)}개 → {out_dir}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("source", choices=["xml", "url", "api"])
    ap.add_argument("inputs", nargs="*")
    ap.add_argument("-o", "--out", default="output")
    args = ap.parse_args()

    if args.source == "xml":
        if len(args.inputs) != 1:
            ap.error("xml 모드는 Library.xml 경로 1개가 필요합니다.")
        playlists = from_library_xml(args.inputs[0])
    elif args.source == "url":
        if not args.inputs:
            ap.error("url 모드는 링크 또는 HTML 파일이 1개 이상 필요합니다.")
        playlists = [from_public_page(s) for s in args.inputs]
    else:
        playlists = from_api()
    write_outputs(playlists, args.out)


if __name__ == "__main__":
    main()
