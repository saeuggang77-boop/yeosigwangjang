import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXTAUTH_URL || "https://yeosi.kr";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/biz/",
          "/ad/",
          "/auth/",
          "/scraps/",
          "/notifications/",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
