import type { MetadataRoute } from "next";
import { getProjects } from "@/lib/queries";
import { docTree } from "@/lib/site";

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:7799").replace(
  /\/$/,
  "",
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getProjects();

  return [
    ...docTree.map((doc) => ({
      url: `${baseUrl}${doc.href}`,
      lastModified: new Date(),
      priority: doc.href === "/" ? 1 : 0.8,
    })),
    ...projects.map((project) => ({
      url: `${baseUrl}/work/${project.slug}`,
      lastModified: new Date(project.updated_at),
      priority: 0.6,
    })),
  ];
}
