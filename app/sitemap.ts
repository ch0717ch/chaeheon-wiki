import type { MetadataRoute } from "next";
import { getProfiles, getProjects } from "@/lib/queries";
import { docTree, site } from "@/lib/site";

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || site.fallbackUrl).replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const profiles = await getProfiles();
  const entries: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date(), priority: 1 },
  ];

  for (const profile of profiles) {
    // 잠긴 문서는 비밀번호 없이는 볼 수 없으니 검색엔진에 알릴 이유가 없다.
    if (profile.view_locked) continue;
    for (const doc of docTree) {
      entries.push({
        url: `${baseUrl}/${profile.slug}${doc.href}`,
        lastModified: new Date(profile.updated_at),
        priority: doc.href === "" ? 0.9 : 0.7,
      });
    }
    const projects = await getProjects(profile.id);
    for (const project of projects) {
      entries.push({
        url: `${baseUrl}/${profile.slug}/work/${project.slug}`,
        lastModified: new Date(project.updated_at),
        priority: 0.5,
      });
    }
  }

  return entries;
}
