"use client";

import Link from "next/link";
import { useState } from "react";
import { site } from "@/lib/site";

/**
 * 잠긴 문서의 열람 비밀번호 입력 화면.
 * 서버 레이아웃이 권한이 없을 때 본문 대신 이것만 내려보낸다 —
 * 문서 내용은 브라우저에 전송조차 되지 않는다.
 */
export default function DocLockGate({ person, name }: { person: string; name: string }) {
  const [key, setKey] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("확인 중...");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, person }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      window.location.reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "실패");
      setBusy(false);
    }
  }

  return (
    <main id="main" className="mx-auto w-full max-w-md px-5 pb-24 pt-20">
      <p className="eyebrow mb-2">{site.name}</p>
      <h1 className="text-2xl font-bold tracking-tight">
        <span aria-hidden className="mr-2 font-mono">
          🔒
        </span>
        {name}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        잠긴 문서다. 열람하려면 문서 비밀번호를 입력한다.
      </p>

      <form onSubmit={unlock} className="mt-6 space-y-3">
        <label htmlFor="doc-key" className="block text-xs font-bold">
          문서 비밀번호
        </label>
        <input
          id="doc-key"
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          autoComplete="off"
          className="w-full border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink"
        />
        <button
          type="submit"
          disabled={busy}
          className="inline-flex min-h-10 w-full items-center justify-center bg-slab px-4 text-sm font-semibold text-on-slab hover:bg-slab-soft disabled:opacity-40"
        >
          열람
        </button>
        {msg ? <p className="text-sm text-red-800">{msg}</p> : null}
      </form>

      <p className="mt-8 text-sm">
        <Link href="/" className="doc-link">
          ← 대문으로
        </Link>
      </p>
    </main>
  );
}
