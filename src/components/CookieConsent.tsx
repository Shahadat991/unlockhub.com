"use client";

import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "unlockhub-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      /* storage blocked — stay hidden */
    }
  }, []);

  const decide = (value: "accepted" | "declined") => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] p-4 animate-fade-in-up">
      <div className="mx-auto flex max-w-2xl flex-col gap-3 rounded-2xl border border-border-soft bg-surface-2/95 p-4 shadow-2xl backdrop-blur sm:flex-row sm:items-center">
        <Cookie className="h-6 w-6 shrink-0 text-primary" />
        <p className="flex-1 text-sm text-muted">
          We use cookies and anonymous analytics to improve UnlockHub and to
          support the free content we share. See our{" "}
          <a href="/privacy" className="text-accent underline-offset-2 hover:underline">
            Privacy Policy
          </a>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => decide("declined")}
            className="rounded-lg border border-border-soft px-4 py-2 text-sm text-muted transition hover:text-foreground"
          >
            Decline
          </button>
          <button
            onClick={() => decide("accepted")}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
