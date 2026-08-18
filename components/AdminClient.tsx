"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CONTENT_SPECS,
  PROFILE_SPEC,
  type FieldSpec,
  type TableSpec,
} from "@/lib/adminSchema";
import { site } from "@/lib/site";

// =====================================================================
// 관리 화면.
//
// 인증키 → 세션 쿠키 → 문서(인물) 선택 → 표별 행 편집.
// 서버의 /api/admin/* 만 호출하며, 이 파일에는 어떤 비밀값도 없다.
// =====================================================================

type Row = Record<string, unknown> & { id: string };

/** DB 행 → 폼 값. 배열은 줄바꿈으로, jsonb 는 들여쓴 JSON 으로 편다. */
function rowToForm(spec: TableSpec, row: Row | null): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (const f of spec.fields) {
    const v = row?.[f.key];
    if (f.type === "bool") out[f.key] = Boolean(v ?? (f.key === "is_published"));
    else if (f.type === "lines") out[f.key] = Array.isArray(v) ? v.join("\n") : "";
    else if (f.type === "json") out[f.key] = v ? JSON.stringify(v, null, 2) : "[]";
    else out[f.key] = v === null || v === undefined ? "" : String(v);
  }
  return out;
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
  return data as T;
}

const inputCls =
  "w-full border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink";
const btnCls =
  "inline-flex min-h-10 items-center justify-center bg-slab px-4 text-sm font-semibold text-on-slab hover:bg-slab-soft disabled:opacity-40";
const btnGhostCls =
  "inline-flex min-h-10 items-center justify-center border border-line px-4 text-sm font-semibold text-ink hover:bg-paper-deep disabled:opacity-40";

/* ---------------------------------------------------------------------
   필드 하나
   --------------------------------------------------------------------- */
function Field({
  field,
  value,
  onChange,
  onUpload,
}: {
  field: FieldSpec;
  value: string | boolean;
  onChange: (v: string | boolean) => void;
  onUpload?: (fieldKey: string) => void;
}) {
  const id = `f-${field.key}`;
  const uploadable = field.key.endsWith("_url") || field.key === "photo_url";

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-bold text-ink">
        {field.label}
        {field.hint ? (
          <span className="ml-2 font-normal text-ink-muted">{field.hint}</span>
        ) : null}
      </label>

      {field.type === "bool" ? (
        <label className="flex min-h-10 items-center gap-2 text-sm">
          <input
            id={id}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4"
          />
          <span>{Boolean(value) ? "예" : "아니오"}</span>
        </label>
      ) : field.type === "select" ? (
        <select
          id={id}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        >
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : field.type === "textarea" || field.type === "lines" || field.type === "json" ? (
        <textarea
          id={id}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          rows={field.type === "json" ? 10 : field.type === "textarea" ? 6 : 4}
          spellCheck={false}
          className={`${inputCls} font-[inherit] leading-relaxed ${
            field.type === "json" ? "font-mono text-xs" : ""
          }`}
        />
      ) : (
        <div className="flex gap-2">
          <input
            id={id}
            type={field.type === "date" ? "date" : field.type === "int" ? "number" : "text"}
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            className={inputCls}
          />
          {uploadable && onUpload ? (
            <button
              type="button"
              onClick={() => onUpload(field.key)}
              className={btnGhostCls}
              title="파일을 올리고 이 칸에 URL 을 채운다"
            >
              업로드
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------
   행 편집기 — 한 테이블의 목록 + 폼
   --------------------------------------------------------------------- */
function TableEditor({
  spec,
  profileId,
  onProfilesChanged,
}: {
  spec: TableSpec;
  profileId: string | null; // profiles 편집일 때는 null
  onProfilesChanged?: () => void;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [editing, setEditing] = useState<Row | null>(null); // null=목록, id 없는 Row=새 행
  const [form, setForm] = useState<Record<string, string | boolean>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<string>("");

  const isProfiles = spec.table === "people";

  const load = useCallback(async () => {
    const data = await api<{ rows: Row[] }>("/api/admin/rows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "list", table: spec.table, profileId }),
    });
    setRows(data.rows);
  }, [spec.table, profileId]);

  useEffect(() => {
    setEditing(null);
    setMsg("");
    load().catch((e) => setMsg(String(e.message ?? e)));
  }, [load]);

  function startEdit(row: Row | null) {
    setEditing(row ?? ({ id: "" } as Row));
    setForm(rowToForm(spec, row));
    setMsg("");
  }

  async function save() {
    setBusy(true);
    setMsg("");
    try {
      await api("/api/admin/rows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upsert",
          table: spec.table,
          profileId,
          id: editing?.id || undefined,
          row: form,
        }),
      });
      setEditing(null);
      await load();
      onProfilesChanged?.();
      setMsg("저장됐다. 사이트에 바로 반영된다.");
    } catch (e) {
      setMsg(`저장 실패: ${e instanceof Error ? e.message : e}`);
    } finally {
      setBusy(false);
    }
  }

  async function remove(row: Row) {
    const name = String(row[spec.titleKey] ?? row.id);
    const warn = isProfiles
      ? `문서 "${name}" 을(를) 삭제하면 딸린 경력·프로젝트·연구 등 모든 내용이 함께 삭제된다. 되돌릴 수 없다. 삭제할까?`
      : `"${name}" 을(를) 삭제할까? 되돌릴 수 없다.`;
    if (!window.confirm(warn)) return;

    // 문서 삭제는 인증키를 그 자리에서 다시 받는다.
    // 서버도 같은 검사를 하므로 여기서 건너뛰어도 삭제되지 않는다.
    let confirmKey: string | undefined;
    if (isProfiles) {
      const input = window.prompt(`삭제를 확정하려면 인증키를 다시 입력한다.`);
      if (input === null) return; // 취소
      confirmKey = input;
    }

    setBusy(true);
    try {
      await api("/api/admin/rows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", table: spec.table, id: row.id, confirmKey }),
      });
      await load();
      onProfilesChanged?.();
      setMsg("삭제됐다.");
    } catch (e) {
      setMsg(`삭제 실패: ${e instanceof Error ? e.message : e}`);
    } finally {
      setBusy(false);
    }
  }

  function pickUpload(fieldKey: string) {
    uploadTarget.current = fieldKey;
    fileRef.current?.click();
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setMsg("업로드 중...");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const data = await api<{ url: string }>("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
      setForm((f) => ({ ...f, [uploadTarget.current]: data.url }));
      setMsg("업로드 완료. 저장을 눌러야 반영된다.");
    } catch (err) {
      setMsg(`업로드 실패: ${err instanceof Error ? err.message : err}`);
    } finally {
      setBusy(false);
    }
  }

  /* ---------------- 편집 폼 ---------------- */
  if (editing !== null) {
    return (
      <div className="border-2 border-rule">
        <div className="flex items-center justify-between bg-slab px-4 py-2 text-on-slab">
          <p className="text-xs font-bold uppercase tracking-[0.15em]">
            {spec.label} — {editing.id ? "수정" : "새 항목"}
          </p>
          <button type="button" onClick={() => setEditing(null)} className="text-sm underline">
            목록으로
          </button>
        </div>

        <div className="space-y-4 p-4">
          {spec.fields.map((f) => (
            <Field
              key={f.key}
              field={f}
              value={form[f.key] ?? (f.type === "bool" ? false : "")}
              onChange={(v) => setForm((prev) => ({ ...prev, [f.key]: v }))}
              onUpload={pickUpload}
            />
          ))}

          <input
            ref={fileRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            className="hidden"
            onChange={onFile}
          />

          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <button type="button" onClick={save} disabled={busy} className={btnCls}>
              {busy ? "저장 중..." : "저장"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              disabled={busy}
              className={btnGhostCls}
            >
              취소
            </button>
            {msg ? <p className="text-sm text-ink-soft">{msg}</p> : null}
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- 목록 ---------------- */
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => startEdit(null)} className={btnCls}>
          + 새 {spec.label}
        </button>
        {msg ? <p className="text-sm text-ink-soft">{msg}</p> : null}
      </div>

      <ul className="mt-4 border-t-2 border-rule">
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-3"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">
                {String(row[spec.titleKey] || "(제목 없음)")}
                {row.is_published === false ? (
                  <span className="ml-2 border border-line px-1.5 py-0.5 text-xs text-ink-muted">
                    초안
                  </span>
                ) : null}
              </p>
              {isProfiles ? (
                <p className="text-xs text-ink-muted">/{String(row.slug ?? "")}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => startEdit(row)}
                className={`${btnGhostCls} min-h-9 px-3`}
              >
                수정
              </button>
              <button
                type="button"
                onClick={() => remove(row)}
                disabled={busy}
                className={`${btnGhostCls} min-h-9 px-3 text-red-800`}
              >
                삭제
              </button>
            </div>
          </li>
        ))}
        {rows.length === 0 ? (
          <li className="py-6 text-sm text-ink-muted">아직 항목이 없다.</li>
        ) : null}
      </ul>
    </div>
  );
}

/* ---------------------------------------------------------------------
   메인 — 로그인 → 문서 선택 → 탭
   --------------------------------------------------------------------- */
export default function AdminClient() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [key, setKey] = useState("");
  const [loginMsg, setLoginMsg] = useState("");
  const [profiles, setProfiles] = useState<Row[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [tab, setTab] = useState<string>("people");

  const loadProfiles = useCallback(async () => {
    try {
      const data = await api<{ rows: Row[] }>("/api/admin/rows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list", table: "people" }),
      });
      setProfiles(data.rows);
      // 선택된 문서가 삭제됐으면 선택을 비운다.
      setProfileId((cur) => (cur && data.rows.some((r) => r.id === cur) ? cur : null));
    } catch {
      /* 로그인 전이면 실패가 정상 */
    }
  }, []);

  useEffect(() => {
    api<{ authed: boolean }>("/api/admin/login")
      .then((d) => setAuthed(d.authed))
      .catch(() => setAuthed(false));
  }, []);

  useEffect(() => {
    if (authed) loadProfiles();
  }, [authed, loadProfiles]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginMsg("확인 중...");
    try {
      await api("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      setKey("");
      setLoginMsg("");
      setAuthed(true);
    } catch (err) {
      setLoginMsg(err instanceof Error ? err.message : "실패");
    }
  }

  async function logout() {
    await api("/api/admin/login", { method: "DELETE" }).catch(() => {});
    setAuthed(false);
    setProfiles([]);
    setProfileId(null);
  }

  /* ---------------- 로그인 화면 ---------------- */
  if (authed === null) {
    return <main id="main" className="p-10 text-sm text-ink-muted">확인 중...</main>;
  }

  if (!authed) {
    return (
      <main id="main" className="mx-auto w-full max-w-md px-5 pb-24 pt-20">
        <p className="eyebrow mb-2">{site.name}</p>
        <h1 className="text-2xl font-bold tracking-tight">관리</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          문서 작성·수정은 인증키가 필요하다.
        </p>

        <form onSubmit={login} className="mt-6 space-y-3">
          <label htmlFor="admin-key" className="block text-xs font-bold">
            인증키
          </label>
          <input
            id="admin-key"
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            autoComplete="off"
            className={inputCls}
          />
          <button type="submit" className={`${btnCls} w-full`}>
            들어가기
          </button>
          {loginMsg ? <p className="text-sm text-red-800">{loginMsg}</p> : null}
        </form>

        <p className="mt-8 text-sm">
          <Link href="/" className="doc-link">
            ← 대문으로
          </Link>
        </p>
      </main>
    );
  }

  /* ---------------- 관리 본화면 ---------------- */
  const selected = profiles.find((p) => p.id === profileId) ?? null;

  return (
    <main id="main" className="mx-auto w-full max-w-4xl px-5 pb-24 pt-10 sm:px-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-rule pb-4">
        <div>
          <p className="eyebrow">{site.name}</p>
          <h1 className="text-2xl font-bold tracking-tight">관리</h1>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="doc-link">
            대문 보기
          </Link>
          <button type="button" onClick={logout} className="doc-link">
            로그아웃
          </button>
        </div>
      </div>

      {/* 문서 선택 */}
      <section className="mt-6">
        <label htmlFor="profile-select" className="mb-1 block text-xs font-bold">
          작업할 문서(인물)
        </label>
        <div className="flex flex-wrap gap-2">
          <select
            id="profile-select"
            value={profileId ?? ""}
            onChange={(e) => {
              setProfileId(e.target.value || null);
              if (e.target.value && tab === "people") setTab("projects");
            }}
            className={`${inputCls} max-w-xs`}
          >
            <option value="">— 문서 선택 —</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {String(p.name)} (/{String(p.slug)})
                {p.is_published === false ? " · 초안" : ""}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => setTab("people")} className={btnGhostCls}>
            문서 관리 / 새 문서
          </button>
          {selected ? (
            <Link
              href={`/${String(selected.slug)}`}
              className={btnGhostCls}
              target="_blank"
            >
              문서 보기 ↗
            </Link>
          ) : null}
        </div>
      </section>

      {/* 탭 */}
      <nav aria-label="편집 대상" className="mt-6 flex flex-wrap gap-1 border-b-2 border-rule">
        <button
          type="button"
          onClick={() => setTab("people")}
          className={`px-3 py-2 text-sm font-semibold ${
            tab === "people" ? "bg-slab text-on-slab" : "text-ink-soft hover:bg-paper-deep"
          }`}
        >
          문서(인물)
        </button>
        {CONTENT_SPECS.map((s) => (
          <button
            key={s.table}
            type="button"
            onClick={() => setTab(s.table)}
            disabled={!profileId}
            className={`px-3 py-2 text-sm font-semibold disabled:opacity-30 ${
              tab === s.table ? "bg-slab text-on-slab" : "text-ink-soft hover:bg-paper-deep"
            }`}
          >
            {s.label}
          </button>
        ))}
      </nav>

      <section className="mt-6">
        {tab === "people" ? (
          <TableEditor
            spec={PROFILE_SPEC}
            profileId={null}
            onProfilesChanged={loadProfiles}
          />
        ) : profileId ? (
          <TableEditor
            key={`${tab}-${profileId}`}
            spec={CONTENT_SPECS.find((s) => s.table === tab)!}
            profileId={profileId}
          />
        ) : (
          <p className="text-sm text-ink-muted">먼저 위에서 문서를 선택한다.</p>
        )}
      </section>
    </main>
  );
}
