import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How UnlockHub collects and uses data.",
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted">Last updated: July 2026</p>

        <div className="prose-invert mt-8 space-y-6 text-sm leading-relaxed text-muted [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground">
          <section>
            <h2>What we collect</h2>
            <p className="mt-2">
              {siteConfig.name} collects anonymous usage analytics when you
              visit a landing page: approximate country (from your IP address),
              device type, browser family, and the site that referred you
              (for example YouTube or Google). Your IP address is never stored
              — it is one-way hashed with a rotating daily key and cannot be
              reversed.
            </p>
          </section>
          <section>
            <h2>Cookies</h2>
            <p className="mt-2">
              We use a single local-storage entry to remember your cookie
              consent choice. Third-party advertising partners, when enabled,
              may set their own cookies — see their respective privacy
              policies.
            </p>
          </section>
          <section>
            <h2>Advertising</h2>
            <p className="mt-2">
              Some pages may display third-party advertisements. Ad networks
              may use cookies or similar technologies to serve relevant ads.
              We do not share any personal information with ad networks.
            </p>
          </section>
          <section>
            <h2>Third-party links</h2>
            <p className="mt-2">
              The Continue button takes you to a third-party destination. Once
              you leave this site, that destination&apos;s own privacy policy
              applies.
            </p>
          </section>
          <section>
            <h2>Data retention & your rights</h2>
            <p className="mt-2">
              Analytics data is aggregate and anonymous. If you have any
              privacy question or request, contact us at{" "}
              <a href={`mailto:${siteConfig.contactEmail}`} className="text-accent hover:underline">
                {siteConfig.contactEmail}
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
