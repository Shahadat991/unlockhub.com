import Link from "next/link";
import { Unlock, Timer, Send, ShieldCheck, LayoutDashboard } from "lucide-react";
import { siteConfig } from "@/config/site";
import { SiteFooter } from "@/components/SiteFooter";
import { ThemeToggle } from "@/components/ThemeToggle";

const steps = [
  {
    icon: Timer,
    title: "Wait a few seconds",
    text: "Open the link from our video and let the short countdown finish.",
  },
  {
    icon: Unlock,
    title: "Your link gets ready",
    text: "The Continue button appears automatically when the timer hits zero.",
  },
  {
    icon: Send,
    title: "Continue",
    text: "One click takes you straight to the content from the video.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* Header with logo + Admin button */}
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15">
            <Unlock className="h-4 w-4 text-primary" />
          </span>
          {siteConfig.name}
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-xl border border-border-soft bg-surface px-4 py-2 text-sm font-medium text-muted transition hover:border-primary/60 hover:text-primary"
          >
            <LayoutDashboard className="h-4 w-4" />
            Admin
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center px-4 pt-14 pb-16 text-center sm:pt-20">
        <div className="flex items-center gap-2 rounded-full border border-border-soft bg-surface px-4 py-1.5 text-xs text-muted animate-fade-in">
          <ShieldCheck className="h-3.5 w-3.5 text-success" />
          Exclusive content, unlocked in seconds
        </div>

        <h1
          className="mt-6 bg-gradient-to-br to-primary/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-6xl animate-fade-in-up"
          style={{
            backgroundImage:
              "linear-gradient(to bottom right, var(--heading-from), var(--heading-from), var(--primary))",
          }}
        >
          {siteConfig.name}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg animate-fade-in-up delay-100">
          {siteConfig.description}
        </p>

        <div className="mt-14 grid w-full gap-4 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="rounded-2xl border border-border-soft bg-surface p-6 text-left animate-fade-in-up"
              style={{ animationDelay: `${150 + i * 100}ms` }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                <step.icon className="h-5 w-5 text-primary" />
              </div>
              <h2 className="mt-4 font-semibold">{step.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {step.text}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-12 text-sm text-muted/70 animate-fade-in-up delay-300">
          Looking for something specific? Use the exact link from the video
          description.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
