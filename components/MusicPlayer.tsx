"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 문서 배경음악 플레이어. 사이드바 상단에 놓이는 작은 재생 버튼이다.
 *
 * 자동재생은 하지 않는다 — 브라우저가 소리 있는 자동재생을 막기도 하고,
 * 이력을 보러 온 사람에게 갑자기 소리가 나는 것은 좋은 경험이 아니다.
 * 사용자가 누를 때만 재생하고, 문서를 이동하면 조용히 멈춘다.
 */
export default function MusicPlayer({
  src,
  title,
  variant = "slab", // slab: 먹지 사이드바용 / paper: 밝은 배경용
}: {
  src: string;
  title?: string;
  variant?: "slab" | "paper";
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // 컴포넌트가 사라질 때(다른 문서로 이동) 재생을 멈춘다.
  useEffect(() => {
    const el = audioRef.current;
    return () => {
      el?.pause();
    };
  }, [src]);

  function toggle() {
    const el = audioRef.current;
    if (!el || failed) return;
    if (el.paused) {
      el.play().catch(() => setFailed(true));
    } else {
      el.pause();
    }
  }

  const label = title?.trim() || "배경음악";
  const tone =
    variant === "slab"
      ? "border-slab-soft text-on-slab hover:bg-slab-soft"
      : "border-line text-ink hover:bg-paper-deep";
  const muted = variant === "slab" ? "text-on-slab-muted" : "text-ink-muted";

  if (failed) return null;

  return (
    <div className={`flex items-center gap-2 text-xs ${muted}`}>
      <audio
        ref={audioRef}
        src={src}
        preload="none"
        loop
        onCanPlay={() => setReady(true)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setFailed(true)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? `${label} 일시정지` : `${label} 재생`}
        title={playing ? "일시정지" : "재생"}
        // 44px 터치 타깃 유지. 아이콘은 문자로 그려 폰트·색을 그대로 따른다.
        className={`flex h-9 w-9 shrink-0 items-center justify-center border font-mono text-sm leading-none transition-colors ${tone}`}
      >
        <span aria-hidden>{playing ? "❚❚" : "▶"}</span>
      </button>
      <span className="min-w-0 truncate">
        <span className="font-mono">♪</span> {label}
        {playing && !ready ? " · 불러오는 중" : ""}
      </span>
    </div>
  );
}
