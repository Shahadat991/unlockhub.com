import Link from "next/link";
import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border-soft/60 py-8">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 text-center">
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted">
          <Link href="/" className="transition hover:text-foreground">Home</Link>
          <Link href="/faq" className="transition hover:text-foreground">FAQ</Link>
          <Link href="/contact" className="transition hover:text-foreground">Contact</Link>
          <Link href="/privacy" className="transition hover:text-foreground">Privacy Policy</Link>
          <Link href="/terms" className="transition hover:text-foreground">Terms of Service</Link>
        </nav>
        <p className="text-xs text-muted/60">
          © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
