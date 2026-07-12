import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdSlots, getPageBySlug } from "@/lib/db";
import { LandingPageClient } from "@/components/LandingPageClient";
import { siteConfig } from "@/config/site";
import type { PublicLandingPage } from "@/types/database";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getPageBySlug(slug, { onlyEnabled: true });
  if (!page) {
    return { title: "Not found", robots: { index: false } };
  }

  const title = page.title;
  const description =
    page.description ||
    `${page.title} — your link will be ready after a short countdown.`;
  const url = `${siteConfig.url}/go/${page.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: siteConfig.name,
      title,
      description,
      ...(page.thumbnail_url && {
        images: [{ url: page.thumbnail_url, width: 1200, height: 630 }],
      }),
    },
    twitter: {
      card: page.thumbnail_url ? "summary_large_image" : "summary",
      title,
      description,
      ...(page.thumbnail_url && { images: [page.thumbnail_url] }),
    },
  };
}

export default async function GoPage({ params }: Props) {
  const { slug } = await params;
  const page = getPageBySlug(slug, { onlyEnabled: true });
  if (!page) notFound();

  const adSlots = getAdSlots().filter((s) => s.enabled);

  // Only safe fields reach the browser — never the destination URL.
  const publicPage: PublicLandingPage = {
    id: page.id,
    slug: page.slug,
    title: page.title,
    description: page.description,
    thumbnail_url: page.thumbnail_url,
    countdown_seconds: page.countdown_seconds,
    auto_redirect: page.auto_redirect,
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    description: page.description,
    url: `${siteConfig.url}/go/${page.slug}`,
    ...(page.thumbnail_url && { image: page.thumbnail_url }),
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <LandingPageClient page={publicPage} adSlots={adSlots} />
    </>
  );
}
