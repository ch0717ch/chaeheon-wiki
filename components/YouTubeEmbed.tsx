/**
 * 유튜브 임베드.
 *
 * 본문 텍스트에서 한 줄이 통째로 유튜브 링크면 그 자리에 플레이어를 띄운다.
 * 문장 중간에 섞인 링크는 건드리지 않는다 — 임베드는 의도적으로 줄을
 * 비워 넣은 링크에만 반응해야 글이 안 깨진다.
 *
 * youtube-nocookie.com 을 쓴다: 재생 전에는 쿠키를 심지 않는 유튜브의
 * 공식 프라이버시 모드다.
 */

const YT_PATTERNS = [
  /^https?:\/\/(?:www\.)?youtube\.com\/watch\?(?:.*&)?v=([A-Za-z0-9_-]{11})(?:[&#].*)?$/,
  /^https?:\/\/youtu\.be\/([A-Za-z0-9_-]{11})(?:[?#].*)?$/,
  /^https?:\/\/(?:www\.)?youtube\.com\/shorts\/([A-Za-z0-9_-]{11})(?:[?#].*)?$/,
  /^https?:\/\/(?:www\.)?youtube\.com\/embed\/([A-Za-z0-9_-]{11})(?:[?#].*)?$/,
  /^https?:\/\/(?:www\.)?youtube\.com\/live\/([A-Za-z0-9_-]{11})(?:[?#].*)?$/,
];

/** 한 줄이 통째로 유튜브 링크면 영상 id, 아니면 null. */
export function extractYouTubeId(line: string): string | null {
  const s = line.trim();
  for (const re of YT_PATTERNS) {
    const m = s.match(re);
    if (m) return m[1];
  }
  return null;
}

export default function YouTubeEmbed({ id }: { id: string }) {
  return (
    <div className="max-w-prose">
      <div className="aspect-video border-2 border-rule bg-slab">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}`}
          title="YouTube 영상"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="h-full w-full"
        />
      </div>
      <p className="mt-1 text-xs text-ink-muted">
        <a
          href={`https://www.youtube.com/watch?v=${id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="doc-link"
        >
          YouTube에서 보기
          <span className="sr-only"> (새 창에서 열림)</span>
        </a>
      </p>
    </div>
  );
}
