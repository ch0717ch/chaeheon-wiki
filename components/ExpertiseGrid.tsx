import { FnText } from "@/components/Footnotes";
import { TagList } from "@/components/Prose";
import type { FootnoteRegistry } from "@/lib/footnotes";
import type { ExpertiseArea } from "@/types";

/**
 * 전문 분야를 영역별로 펼친 표.
 * 영역 제목을 먹지로 반전시켜 목록이 길어져도 어디가 경계인지 보이게 했다.
 */
export default function ExpertiseGrid({
  areas,
  fn,
}: {
  areas: ExpertiseArea[];
  fn?: FootnoteRegistry;
}) {
  if (!areas.length) return null;

  return (
    <div className="space-y-6">
      {areas.map((area) => (
        <section key={area.title} className="border-2 border-rule">
          <div className="bg-slab px-4 py-2 text-on-slab">
            <h4 className="text-sm font-bold tracking-tight">
              <FnText text={area.title} registry={fn} />
            </h4>
            {area.summary ? (
              <p className="mt-0.5 text-xs leading-relaxed text-on-slab-muted">
                <FnText text={area.summary} registry={fn} />
              </p>
            ) : null}
          </div>
          <div className="px-4 py-3">
            <TagList items={area.skills} label={`${area.title} 역량`} fn={fn} />
          </div>
        </section>
      ))}
    </div>
  );
}
