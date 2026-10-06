import type { MetadataRoute } from "next";
import { CAFES } from "@/lib/data/cafes";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => new URL(path, SITE_URL).toString();
  return [
    { url: url("/"), changeFrequency: "daily", priority: 1 },
    { url: url("/recommend"), changeFrequency: "weekly", priority: 0.7 },
    ...CAFES.map((c) => ({ url: url(`/cafe/${c.id}`), changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
