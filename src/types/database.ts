export interface LandingPage {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  destination_url: string;
  countdown_seconds: number;
  auto_redirect: boolean;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * What landing pages send to the visitor's browser. The destination
 * URL is deliberately absent — visitors only ever reach it through
 * the server-side /api/redirect/[slug] endpoint.
 */
export type PublicLandingPage = Omit<
  LandingPage,
  "destination_url" | "enabled" | "created_at" | "updated_at"
>;

export interface PageWithStats extends LandingPage {
  visit_count: number;
  redirect_count: number;
}

export interface Visit {
  id: number;
  page_id: string;
  visitor_hash: string;
  country: string;
  device: string;
  browser: string;
  referrer_source: string;
  referrer: string;
  created_at: string;
}

export type TrackedEventType = "countdown_complete" | "button_click";

export interface TrackedEvent {
  id: number;
  page_id: string;
  visitor_hash: string;
  event_type: TrackedEventType;
  created_at: string;
}

export type AdSlotPosition = "top" | "middle" | "bottom" | "sticky" | "sidebar";

export interface AdSlotRecord {
  position: AdSlotPosition;
  enabled: boolean;
  label: string;
  code: string;
  min_height: number;
}
