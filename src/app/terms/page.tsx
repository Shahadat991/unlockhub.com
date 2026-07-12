import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for using UnlockHub.",
};

export default function TermsPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
        <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted">Last updated: July 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground">
          <section>
            <h2>1. Acceptance</h2>
            <p className="mt-2">
              By using {siteConfig.name} you agree to these terms. If you do
              not agree, please do not use the site.
            </p>
          </section>
          <section>
            <h2>2. Service</h2>
            <p className="mt-2">
              {siteConfig.name} provides landing pages that link to content
              hosted on third-party services. We are not responsible for the
              availability of those services or their content.
            </p>
          </section>
          <section>
            <h2>3. Acceptable use</h2>
            <p className="mt-2">
              You may not attempt to bypass countdowns programmatically, scrape
              the site, abuse the analytics endpoints, or use the service for
              any unlawful purpose.
            </p>
          </section>
          <section>
            <h2>4. Intellectual property</h2>
            <p className="mt-2">
              All trademarks and content names belong to their respective owners.
              If you believe content linked from this site infringes your
              rights, contact us and we will review it promptly.
            </p>
          </section>
          <section>
            <h2>5. No warranty</h2>
            <p className="mt-2">
              The service is provided &quot;as is&quot; without warranties of
              any kind. We may change or discontinue any part of the service
              at any time.
            </p>
          </section>
          <section>
            <h2>6. Contact</h2>
            <p className="mt-2">
              Questions about these terms:{" "}
              <a href={`mailto:${siteConfig.contactEmail}`} className="text-accent hover:underline">
                {siteConfig.contactEmail}
              </a>
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
