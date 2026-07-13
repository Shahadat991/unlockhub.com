import type { MetadataRoute } from "next";
import { listPages } from "@/lib/db";
import { siteConfig } from "@/config/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: siteConfig.url, changeFrequency: "weekly", priority: 1 },
    { url: `${siteConfig.url}/faq`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteConfig.url}/contact`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteConfig.url}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteConfig.url}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const pageEntries: MetadataRoute.Sitemap = (await listPages())
      .filter((p) => p.enabled)
      .map((p) => ({
        url: `${siteConfig.url}/go/${p.slug}`,
        lastModified: new Date(p.updated_at),
        changeFrequency: "weekly",
        priority: 0.8,
      }));

    return [...staticEntries, ...pageEntries];
  } catch {
    return staticEntries;
  }
}
