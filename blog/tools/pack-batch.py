"""규칙 v2 배치 폴더를 압축파일 하나로 묶는다.
사용법: python3 blog/tools/pack-batch.py blog/posts/<블로그키>/<날짜> [--out 출력폴더]
결과: <출력폴더>/배치_YYYYMMDD_<블로그명>.zip
  배치_YYYYMMDD_<블로그명>/NN_키워드(카테고리).html
  배치_YYYYMMDD_<블로그명>/NN_키워드(카테고리)_썸네일.png
  배치_YYYYMMDD_<블로그명>/배치정보.txt
"""
import json
import os
import sys
import zipfile

args = sys.argv[1:]
root = os.path.abspath(args[0])
blog_dir = os.path.dirname(os.path.dirname(os.path.dirname(root)))  # .../blog
out_dir = os.path.abspath(args[args.index("--out") + 1]) if "--out" in args else os.path.join(blog_dir, "out")
key = os.path.basename(os.path.dirname(root))
conf = json.load(open(os.path.join(blog_dir, "blogs.json"), encoding="utf-8"))[key]
name = f"배치_{os.path.basename(root).replace('-', '')}_{conf['batchName']}"
batch = os.path.join(root, name)
files = sorted(f for f in os.listdir(batch) if f.endswith((".html", ".png")) or f == "배치정보.txt")
htmls = [f for f in files if f.endswith(".html")]
pngs = [f for f in files if f.endswith(".png")]
if "배치정보.txt" not in files or len(htmls) != len(pngs):
    sys.exit(f"배치 폴더가 덜 만들어짐: html {len(htmls)}, png {len(pngs)}, 배치정보.txt {'있음' if '배치정보.txt' in files else '없음'}")
os.makedirs(out_dir, exist_ok=True)
out = os.path.join(out_dir, f"{name}.zip")
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for f in files:
        z.write(os.path.join(batch, f), f"{name}/{f}")
print(out)
