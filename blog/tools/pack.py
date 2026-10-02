"""오늘 글을 압축파일 하나로 묶는다.
사용법: python3 blog/tools/pack.py blog/posts/<블로그키>/<날짜> [--only 04,05,06] [--out 출력폴더]
압축파일 이름은 blog/blogs.json 의 label 을 쓴다 (예: 1번블로그_비즈니스경제_2026-10-02.zip)

압축 구성 (사용법 파일은 만들지 않는다)
  <label>_<날짜>/발행메모_<날짜>.txt   ← 글별 제목 3안·태그·발행 전 체크
  <label>_<날짜>/<글폴더>/post.html     ← 열어서 Ctrl+A, Ctrl+C → 네이버에 붙여넣기
  <label>_<날짜>/<글폴더>/thumb.png     ← 대표 이미지
"""
import json
import os
import sys
import zipfile

args = sys.argv[1:]
root = os.path.abspath(args[0])
only = args[args.index("--only") + 1].split(",") if "--only" in args else None
blog_dir = os.path.dirname(os.path.dirname(os.path.dirname(root)))  # .../blog
out_dir = os.path.abspath(args[args.index("--out") + 1]) if "--out" in args else os.path.join(blog_dir, "out")
date = os.path.basename(root)
key = os.path.basename(os.path.dirname(root))
blogs = json.load(open(os.path.join(blog_dir, "blogs.json"), encoding="utf-8"))
label = blogs.get(key, {}).get("label", f"블로그_{key}")
top = f"{label}_{date}"
os.makedirs(out_dir, exist_ok=True)
out = os.path.join(out_dir, f"{top}.zip")

with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    z.write(os.path.join(root, f"발행메모_{date}.txt"), f"{top}/발행메모_{date}.txt")
    for d in sorted(os.listdir(root)):
        post = os.path.join(root, d)
        if not os.path.isfile(os.path.join(post, "post.html")):
            continue
        if only and not any(d.startswith(n + "-") for n in only):
            continue
        for f in ("post.html", "thumb.png"):
            z.write(os.path.join(post, f), f"{top}/{d}/{f}")

print(out)
