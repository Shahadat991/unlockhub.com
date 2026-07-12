import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { siteConfig } from "@/config/site";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the UnlockHub team.",
};

export default function ContactPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
        <h1 className="text-3xl font-bold tracking-tight animate-fade-in-up">
          Contact us
        </h1>
        <p className="mt-3 text-muted animate-fade-in-up delay-100">
          Questions, broken links, DMCA requests, or business inquiries — send
          us an email and we&apos;ll get back to you.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <a
            href={`mailto:${siteConfig.contactEmail}`}
            className="group rounded-2xl border border-border-soft bg-surface p-6 transition hover:border-primary/50 animate-fade-in-up delay-100"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <h2 className="mt-4 font-semibold group-hover:text-primary">
              Email
            </h2>
            <p className="mt-1 break-all text-sm text-muted">
              {siteConfig.contactEmail}
            </p>
          </a>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
