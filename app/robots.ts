import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // 개인 기록 화면(계획·후기·내 작업)은 검색에 노출하지 않는다
    rules: { userAgent: "*", allow: "/", disallow: ["/plans/", "/my", "/cafe/*/plan", "/cafe/*/review"] },
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
  };
}
