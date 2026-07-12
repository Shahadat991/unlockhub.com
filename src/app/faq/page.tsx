import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about UnlockHub — how the countdown works and more.",
};

const faqs = [
  {
    q: "Why do I have to wait for a countdown?",
    a: "The short countdown helps support the site so we can keep sharing content for free. It only takes a few seconds — the Continue button appears automatically.",
  },
  {
    q: "Where does the Continue button take me?",
    a: "Straight to the content featured in the video you came from.",
  },
  {
    q: "The Continue button never appears. What do I do?",
    a: "Make sure JavaScript is enabled and you're not blocking scripts on this site. Try refreshing the page or opening it in a different browser.",
  },
  {
    q: "Is it safe?",
    a: "We only link to our own content. Always use the exact link from our video descriptions to avoid fakes.",
  },
  {
    q: "A link from a video shows 404 — why?",
    a: "The page may have been removed or replaced. Check the newest video for the updated link.",
  },
];

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
        <h1 className="text-3xl font-bold tracking-tight animate-fade-in-up">
          Frequently Asked Questions
        </h1>
        <div className="mt-8 flex flex-col gap-3">
          {faqs.map((f, i) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-border-soft bg-surface p-5 animate-fade-in-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <summary className="cursor-pointer list-none font-semibold marker:hidden">
                {f.q}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-10 text-sm text-muted">
          Still stuck?{" "}
          <Link href="/contact" className="text-accent hover:underline">
            Contact us
          </Link>
          .
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
