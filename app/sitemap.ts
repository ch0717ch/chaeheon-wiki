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
