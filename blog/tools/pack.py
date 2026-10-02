"""오늘 글을 압축파일 하나로 묶는다.
사용법: python3 blog/tools/pack.py blog/posts/2026-10-02 [--only 04,05,06] [--out 출력폴더]

압축 구성 (사용법 파일은 만들지 않는다)
  블로그_<날짜>/발행메모_<날짜>.txt   ← 글별 제목 3안·태그·발행 전 체크
  블로그_<날짜>/<글폴더>/post.html     ← 열어서 Ctrl+A, Ctrl+C → 네이버에 붙여넣기
  블로그_<날짜>/<글폴더>/thumb.png     ← 대표 이미지
"""
import os
import sys
import zipfile

args = sys.argv[1:]
root = os.path.abspath(args[0])
only = args[args.index("--only") + 1].split(",") if "--only" in args else None
out_dir = os.path.abspath(args[args.index("--out") + 1]) if "--out" in args else os.path.join(os.path.dirname(os.path.dirname(root)), "out")
date = os.path.basename(root)
top = f"블로그_{date}"
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
