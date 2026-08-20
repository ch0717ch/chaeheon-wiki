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
  initialEditId,
  onInitialConsumed,
  onExit,
  canDeleteProfile = true,
  canCreate = true,
}: {
  spec: TableSpec;
  profileId: string | null; // profiles 편집일 때는 null
  onProfilesChanged?: () => void;
  /** 딥링크로 곧장 열 행 id. "new" 면 새 항목 작성. */
  initialEditId?: string;
  onInitialConsumed?: () => void;
  /** 있으면 저장·취소 시 목록 대신 이 콜백(원래 페이지 복귀)을 부른다. */
  onExit?: () => void;
  /** 문서 세션은 문서(people) 삭제·신규 생성이 불가하다. */
  canDeleteProfile?: boolean;
  canCreate?: boolean;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [editing, setEditing] = useState<Row | null>(null); // null=목록, id 없는 Row=새 행
  const [form, setForm] = useState<Record<string, string | boolean>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<string>("");
  const initialConsumed = useRef(false);

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

  /** 딥링크([수정] 링크)로 들어왔으면 목록을 거치지 않고 바로 폼을 연다. */
  useEffect(() => {
    if (!initialEditId || initialConsumed.current) return;
    if (initialEditId === "new") {
      initialConsumed.current = true;
      onInitialConsumed?.();
      startEdit(null);
      return;
    }
    const row = rows.find((r) => r.id === initialEditId);
    if (row) {
      initialConsumed.current = true;
      onInitialConsumed?.();
      startEdit(row);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, initialEditId]);

  /** 편집 종료 — 딥링크면 원래 보던 페이지로, 아니면 목록으로. */
  function exitEditor() {
    if (onExit) onExit();
    else setEditing(null);
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
      // 딥링크로 들어온 편집이면 저장 즉시 보던 페이지로 돌아간다.
      if (onExit) {
        onExit();
        return;
      }
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
    if (file.size > 40 * 1024 * 1024) {
      setMsg("40MB 를 넘는 파일은 올릴 수 없다.");
      return;
    }
    setBusy(true);
    setMsg(`업로드 중... (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
    try {
      // 확장자로 MIME 을 보정한다. 브라우저가 wav/mp3 의 type 을 비우는 경우가 있다.
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const guessed: Record<string, string> = {
        mp3: "audio/mpeg",
        wav: "audio/wav",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        webp: "image/webp",
        pdf: "application/pdf",
      };
      const contentType = file.type || guessed[ext] || "";

      // 1) 서버에서 서명 URL 을 받는다 (인증 확인은 여기서 이뤄진다)
      const t = await api<{ signedUrl: string; publicUrl: string }>(
        "/api/admin/upload-url",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // 문서 세션은 자기 문서 id 로 업로드 권한을 증명한다.
          body: JSON.stringify({ contentType, profileId: profileId ?? editing?.id ?? "" }),
        },
      );

      // 2) 파일은 Supabase Storage 로 직접 올린다. Netlify 의 6MB 제한을 우회한다.
      const put = await fetch(t.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType, "x-upsert": "false" },
        body: file,
      });
      if (!put.ok) {
        const txt = await put.text().catch(() => "");
        throw new Error(`저장소 업로드 실패 (${put.status}) ${txt.slice(0, 120)}`);
      }

      setForm((f) => ({ ...f, [uploadTarget.current]: t.publicUrl }));
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
          <button type="button" onClick={exitEditor} className="text-sm underline">
            {onExit ? "문서로 돌아가기" : "목록으로"}
          </button>
        </div>

        <div className="space-y-4 p-4">
          {/* 문서 비밀번호 상태 — "빈 칸이면 풀리는 것 아닌가" 하는 혼동을 없앤다. */}
          {isProfiles && editing.id ? (
            <p
              className={`border-l-2 pl-3 text-sm font-semibold leading-relaxed ${
                editing.has_password
                  ? "border-green-600 text-green-700"
                  : "border-red-700 text-red-700"
              }`}
            >
              {editing.has_password
                ? "문서 비밀번호: 설정됨 · 아래 '비밀번호 변경' 칸을 비워 두면 지금 비밀번호가 그대로 유지된다."
                : "문서 비밀번호: 없음 · 지금은 누구나 이 문서를 수정할 수 있다. 설정을 권장한다."}
            </p>
          ) : null}
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
            accept=".jpg,.jpeg,.png,.webp,.pdf,.mp3,.wav"
            className="hidden"
            onChange={onFile}
          />

          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <button type="button" onClick={save} disabled={busy} className={btnCls}>
              {busy ? "저장 중..." : "저장"}
            </button>
            <button
              type="button"
              onClick={exitEditor}
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
        {canCreate ? (
          <button type="button" onClick={() => startEdit(null)} className={btnCls}>
            + 새 {spec.label}
          </button>
        ) : (
          <span className="text-sm text-ink-muted">내 문서만 관리할 수 있다.</span>
        )}
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
                <p className="text-xs text-ink-muted">
                  /{String(row.slug ?? "")}
                  {row.has_password ? (
                    <span className="ml-2 text-green-700">비번 있음</span>
                  ) : (
                    <span className="ml-2 font-semibold text-red-700">
                      비번 없음 — 누구나 수정 가능
                    </span>
                  )}
                </p>
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
              {!isProfiles || canDeleteProfile ? (
                <button
                  type="button"
                  onClick={() => remove(row)}
                  disabled={busy}
                  className={`${btnGhostCls} min-h-9 px-3 text-red-800`}
                >
                  삭제
                </button>
              ) : null}
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
  // scope: master = 인증키(모든 문서) / doc = 문서 비밀번호(자기 문서만)
  const [scope, setScope] = useState<"master" | "doc" | null | "checking">("checking");
  const [docInfo, setDocInfo] = useState<{ id: string; slug: string } | null>(null);
  const [key, setKey] = useState("");
  const [loginMsg, setLoginMsg] = useState("");
  const [profiles, setProfiles] = useState<Row[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [tab, setTab] = useState<string>("people");

  // 문서의 [수정] 링크 딥링크: ?table=..&id=..&person=..&back=..
  const [deepLink, setDeepLink] = useState<{
    table: string;
    id?: string;
    person?: string;
    back?: string;
  } | null>(null);
  const [initialEditId, setInitialEditId] = useState<string | null>(null);
  const [backUrl, setBackUrl] = useState<string | null>(null);

  // ?create=1 — 인증 없이 새 문서 만들기
  const [createMode, setCreateMode] = useState(false);
  const [cName, setCName] = useState("");
  const [cSlug, setCSlug] = useState("");
  const [cPw, setCPw] = useState("");
  const [cLocked, setCLocked] = useState(false);
  const [cMsg, setCMsg] = useState("");

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("create")) setCreateMode(true);
    const table = sp.get("table");
    if (table) {
      setDeepLink({
        table,
        id: sp.get("id") ?? undefined,
        person: sp.get("person") ?? undefined,
        back: sp.get("back") ?? undefined,
      });
    }
    // 세션 확인 — 딥링크에 person 이 있으면 그 문서 세션도 함께 본다.
    const person = sp.get("person") ?? "";
    api<{ master: boolean; doc: { id: string; slug: string } | null }>(
      `/api/admin/login${person ? `?person=${encodeURIComponent(person)}` : ""}`,
    )
      .then((d) => {
        if (d.master) setScope("master");
        else if (d.doc) {
          setScope("doc");
          setDocInfo(d.doc);
        } else setScope(null);
      })
      .catch(() => setScope(null));
  }, []);

  const loadProfiles = useCallback(async () => {
    try {
      const body: Record<string, unknown> = { action: "list", table: "people" };
      // 문서 세션은 자기 id 로 권한을 증명한다.
      if (docInfo) body.profileId = docInfo.id;
      const data = await api<{ rows: Row[] }>("/api/admin/rows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setProfiles(data.rows);
      setProfileId((cur) => {
        if (cur && data.rows.some((r) => r.id === cur)) return cur;
        // 문서 세션은 선택지가 하나뿐이니 바로 고른다.
        return data.rows.length === 1 ? data.rows[0].id : null;
      });
    } catch {
      /* 로그인 전이면 실패가 정상 */
    }
  }, [docInfo]);

  useEffect(() => {
    if (scope === "master" || scope === "doc") loadProfiles();
  }, [scope, loadProfiles]);

  // 딥링크를 실제 상태로 옮긴다.
  useEffect(() => {
    if (!deepLink || scope === "checking" || scope === null) return;
    const backOk =
      deepLink.back && deepLink.back.startsWith("/") && !deepLink.back.startsWith("//")
        ? deepLink.back
        : null;

    if (deepLink.table === "people") {
      setTab("people");
      setInitialEditId(deepLink.id ?? "new");
      setBackUrl(backOk);
      setDeepLink(null);
      return;
    }
    if (!profiles.length) return;
    const prof = deepLink.person
      ? profiles.find((p) => String(p.slug) === deepLink.person)
      : null;
    if (prof) {
      setProfileId(prof.id);
      setTab(deepLink.table);
      setInitialEditId(deepLink.id ?? "new");
      setBackUrl(backOk);
    }
    setDeepLink(null);
  }, [deepLink, scope, profiles]);

  const exitToBack = backUrl ? () => window.location.assign(backUrl) : undefined;

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginMsg("확인 중...");
    try {
      const d = await api<{ scope: "master" | "doc"; doc?: { id: string; slug: string } }>(
        "/api/admin/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, person: deepLink?.person }),
        },
      );
      setKey("");
      setLoginMsg("");
      if (d.scope === "doc" && d.doc) setDocInfo(d.doc);
      setScope(d.scope);
    } catch (err) {
      setLoginMsg(err instanceof Error ? err.message : "실패");
    }
  }

  async function logout() {
    await api("/api/admin/login", { method: "DELETE" }).catch(() => {});
    setScope(null);
    setDocInfo(null);
    setProfiles([]);
    setProfileId(null);
  }

  async function createDoc(e: React.FormEvent) {
    e.preventDefault();
    setCMsg("만드는 중...");
    try {
      const d = await api<{ doc: { id: string; slug: string } }>("/api/doc/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cName, slug: cSlug, password: cPw, viewLocked: cLocked }),
      });
      // 생성 즉시 그 문서의 편집 세션이 발급된다 — 프로필 편집으로 이동.
      window.location.assign(
        `/admin?person=${encodeURIComponent(d.doc.slug)}&table=people&id=${d.doc.id}&back=/${d.doc.slug}`,
      );
    } catch (err) {
      setCMsg(err instanceof Error ? err.message : "실패");
    }
  }

  /* ---------------- 로딩 ---------------- */
  if (scope === "checking") {
    return <main id="main" className="p-10 text-sm text-ink-muted">확인 중...</main>;
  }

  /* ---------------- 새 문서 만들기 (인증 불필요) ---------------- */
  if (scope === null && createMode) {
    return (
      <main id="main" className="mx-auto w-full max-w-md px-5 pb-24 pt-20">
        <p className="eyebrow mb-2">{site.name}</p>
        <h1 className="text-2xl font-bold tracking-tight">새 문서 만들기</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          누구나 문서를 만들 수 있다. 문서 비밀번호는 이 문서를 수정할 때(잠갔다면
          열람할 때도) 쓰이니 잊지 않게 보관한다.
        </p>

        <form onSubmit={createDoc} className="mt-6 space-y-4">
          <div>
            <label htmlFor="c-name" className="mb-1 block text-xs font-bold">
              이름 (문서 제목)
            </label>
            <input id="c-name" value={cName} onChange={(e) => setCName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="c-slug" className="mb-1 block text-xs font-bold">
              URL 조각 <span className="font-normal text-ink-muted">비우면 이름으로 만든다</span>
            </label>
            <input id="c-slug" value={cSlug} onChange={(e) => setCSlug(e.target.value)} placeholder="예: gildong" className={inputCls} />
          </div>
          <div>
            <label htmlFor="c-pw" className="mb-1 block text-xs font-bold">
              문서 비밀번호{" "}
              <span className="font-normal text-ink-muted">선택 · 4자 이상</span>
            </label>
            <input id="c-pw" type="password" value={cPw} onChange={(e) => { setCPw(e.target.value); if (!e.target.value) setCLocked(false); }} autoComplete="new-password" className={inputCls} />
            {/* 정책 고지 — 반드시 눈에 띄어야 하는 문구라 빨간색을 쓴다. */}
            <p className="mt-2 border-l-2 border-red-700 pl-3 text-sm font-semibold leading-relaxed text-red-700">
              비밀번호 설정을 강력히 권장한다. 비밀번호를 설정하지 않은 문서는{" "}
              <strong>누구나 수정·삭제할 수 있으며</strong>, 그로 인한 문서의
              변형·삭제·수정에 대해 운영자는 책임지지 않는다.
            </p>
          </div>
          <label className={`flex items-center gap-2 text-sm ${cPw ? "" : "opacity-40"}`}>
            <input type="checkbox" checked={cLocked} disabled={!cPw} onChange={(e) => setCLocked(e.target.checked)} className="h-4 w-4" />
            문서 잠금 — 비밀번호를 입력해야 열람 가능 (비밀번호 설정 시에만)
          </label>
          <button type="submit" className={`${btnCls} w-full`}>
            문서 만들기
          </button>
          {cMsg ? <p className="text-sm text-red-800">{cMsg}</p> : null}
        </form>

        <p className="mt-8 space-x-4 text-sm">
          <Link href="/" className="doc-link">
            ← 대문으로
          </Link>
          <button type="button" onClick={() => setCreateMode(false)} className="doc-link">
            이미 만든 문서 관리하기
          </button>
        </p>
      </main>
    );
  }

  /* ---------------- 로그인 ---------------- */
  if (scope === null) {
    return (
      <main id="main" className="mx-auto w-full max-w-md px-5 pb-24 pt-20">
        <p className="eyebrow mb-2">{site.name}</p>
        <h1 className="text-2xl font-bold tracking-tight">관리</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          {deepLink?.person
            ? `"${deepLink.person}" 문서의 비밀번호 또는 마스터 인증키를 입력한다.`
            : "마스터 인증키를 입력한다. 내 문서만 고치려면 그 문서의 [수정] 링크로 들어온다."}
        </p>

        <form onSubmit={login} className="mt-6 space-y-3">
          <label htmlFor="admin-key" className="block text-xs font-bold">
            {deepLink?.person ? "문서 비밀번호 / 인증키" : "인증키"}
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

        <p className="mt-8 space-x-4 text-sm">
          <Link href="/" className="doc-link">
            ← 대문으로
          </Link>
          <button type="button" onClick={() => setCreateMode(true)} className="doc-link">
            + 새 문서 만들기
          </button>
        </p>
      </main>
    );
  }

  /* ---------------- 관리 본화면 ---------------- */
  const isMaster = scope === "master";
  const selected = profiles.find((p) => p.id === profileId) ?? null;

  return (
    <main id="main" className="mx-auto w-full max-w-4xl px-5 pb-24 pt-10 sm:px-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-rule pb-4">
        <div>
          <p className="eyebrow">{site.name}</p>
          <h1 className="text-2xl font-bold tracking-tight">
            관리
            <span className="ml-3 align-middle text-xs font-normal text-ink-muted">
              {isMaster ? "마스터 — 모든 문서" : `문서 세션 — /${docInfo?.slug}`}
            </span>
          </h1>
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
            disabled={!isMaster && profiles.length <= 1}
            className={`${inputCls} max-w-xs`}
          >
            <option value="">— 문서 선택 —</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {String(p.name)} (/{String(p.slug)})
                {p.view_locked ? " · 잠금" : ""}
                {p.is_published === false ? " · 초안" : ""}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => setTab("people")} className={btnGhostCls}>
            {isMaster ? "문서 관리 / 새 문서" : "내 문서 정보"}
          </button>
          {selected ? (
            <Link href={`/${String(selected.slug)}`} className={btnGhostCls} target="_blank">
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
            profileId={docInfo?.id ?? null}
            onProfilesChanged={loadProfiles}
            initialEditId={initialEditId ?? undefined}
            onInitialConsumed={() => setInitialEditId(null)}
            onExit={exitToBack}
            canDeleteProfile={isMaster}
            canCreate={isMaster}
          />
        ) : profileId ? (
          <TableEditor
            key={`${tab}-${profileId}`}
            spec={CONTENT_SPECS.find((s) => s.table === tab)!}
            profileId={profileId}
            initialEditId={initialEditId ?? undefined}
            onInitialConsumed={() => setInitialEditId(null)}
            onExit={exitToBack}
          />
        ) : (
          <p className="text-sm text-ink-muted">먼저 위에서 문서를 선택한다.</p>
        )}
      </section>
    </main>
  );
}
