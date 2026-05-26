// Tourism-segment seed data for demo orgs.
// Targets the schema used by travelplace-bf (the canonical port of BF's
// tourism vertical): hotels, contacts, orders, audit_log, all scoped by
// org_id.

import { demosSupabase } from "../../database/demos-client.js";
import { logger } from "../../utils/logger.js";
import type { CompanySpec } from "../../types/demo.js";

export interface TourismSeedResult {
  hotels: number;
  contacts: number;
  orders: number;
  audit: number;
}

const HOTEL_NAMES = [
  "Citadel Narikala",
  "Stamba Boutique",
  "Old Tbilisi Palace",
  "Adjara Beach Suites",
  "Mtskheta Heritage",
];
const HOTEL_CITIES = ["Tbilisi", "Tbilisi", "Tbilisi", "Batumi", "Mtskheta"];
const HOTEL_TIERS: Array<"3*" | "4*" | "5*"> = ["4*", "5*", "5*", "4*", "3*"];

const CONTACT_FIRST = ["Nino", "Giorgi", "Mariam", "David", "Tamar"];
const CONTACT_LAST = [
  "Beridze",
  "Kapanadze",
  "Tsereteli",
  "Lomidze",
  "Gigauri",
];

const ORDER_LEVELS = ["booking", "inquiry", "confirmed", "refunded"] as const;

export async function seedTourism(
  demoOrgId: string,
  company: CompanySpec,
): Promise<TourismSeedResult> {
  const db = demosSupabase();
  const result: TourismSeedResult = {
    hotels: 0,
    contacts: 0,
    orders: 0,
    audit: 0,
  };

  // Register the demo org first so brand-config queries by ?demo=<jobId> work.
  await db.from("demo_orgs").upsert({
    id: demoOrgId,
    name: company.name,
    brand_color: company.color ?? "#0ea5e9",
    brand_logo: company.logo ?? null,
    segment: "tourism",
    seeded_at: new Date().toISOString(),
  });

  // Hotels
  const hotels = HOTEL_NAMES.map((name, i) => ({
    org_id: demoOrgId,
    name,
    city: HOTEL_CITIES[i],
    tier: HOTEL_TIERS[i],
    rooms: 30 + i * 12,
    base_price_eur: 90 + i * 35,
    balance_eur: Math.round((i + 1) * 1450 - 312),
    is_active: true,
  }));
  const { data: hotelRows, error: hotelErr } = await db
    .from("hotels")
    .insert(hotels)
    .select("id");
  if (hotelErr) {
    logger.warn("seedTourism: hotels insert failed", {
      error: hotelErr.message,
    });
  } else {
    result.hotels = hotelRows?.length ?? 0;
  }

  // Contacts
  const contacts = CONTACT_FIRST.map((first, i) => ({
    org_id: demoOrgId,
    name: `${first} ${CONTACT_LAST[i]}`,
    email: `${first.toLowerCase()}.${CONTACT_LAST[i].toLowerCase()}@example.ge`,
    phone: `+995 555 ${100 + i * 17} ${(i + 1) * 11}${(i + 1) * 11}`,
    role: i === 0 ? "travel_agent" : "guest",
  }));
  const { data: contactRows, error: contactErr } = await db
    .from("contacts")
    .insert(contacts)
    .select("id");
  if (contactErr) {
    logger.warn("seedTourism: contacts insert failed", {
      error: contactErr.message,
    });
  } else {
    result.contacts = contactRows?.length ?? 0;
  }

  // Orders spanning the past 30 days
  const orders = [];
  const now = Date.now();
  for (let i = 0; i < 12; i++) {
    const hotelIdx = i % HOTEL_NAMES.length;
    const contactIdx = i % CONTACT_FIRST.length;
    const daysAgo = i * 2.5;
    orders.push({
      org_id: demoOrgId,
      hotel_id: hotelRows?.[hotelIdx]?.id ?? null,
      contact_id: contactRows?.[contactIdx]?.id ?? null,
      level: ORDER_LEVELS[i % ORDER_LEVELS.length],
      total_eur: 280 + i * 95,
      check_in: new Date(now - daysAgo * 86400_000).toISOString().slice(0, 10),
      check_out: new Date(now - (daysAgo - 3) * 86400_000)
        .toISOString()
        .slice(0, 10),
      created_at: new Date(now - daysAgo * 86400_000).toISOString(),
    });
  }
  const { error: orderErr } = await db.from("orders").insert(orders);
  if (orderErr) {
    logger.warn("seedTourism: orders insert failed", {
      error: orderErr.message,
    });
  } else {
    result.orders = orders.length;
  }

  // Audit log — last 24h activity feed
  const audit = [
    { action: "hotel.create", target: "Citadel Narikala", actor: "system" },
    { action: "order.confirmed", target: "TBL-0042", actor: "Nino Beridze" },
    { action: "contact.added", target: "David Lomidze", actor: "Giorgi K." },
    { action: "order.refunded", target: "TBL-0039", actor: "system" },
    {
      action: "hotel.price_updated",
      target: "Stamba Boutique",
      actor: "Mariam T.",
    },
  ].map((row, i) => ({
    ...row,
    org_id: demoOrgId,
    occurred_at: new Date(now - i * 4 * 3600_000).toISOString(),
  }));
  const { error: auditErr } = await db.from("audit_log").insert(audit);
  if (auditErr) {
    logger.warn("seedTourism: audit insert failed", {
      error: auditErr.message,
    });
  } else {
    result.audit = audit.length;
  }

  return result;
}

export async function unseedTourism(demoOrgId: string): Promise<void> {
  const db = demosSupabase();
  await db.from("audit_log").delete().eq("org_id", demoOrgId);
  await db.from("orders").delete().eq("org_id", demoOrgId);
  await db.from("contacts").delete().eq("org_id", demoOrgId);
  await db.from("hotels").delete().eq("org_id", demoOrgId);
  await db.from("demo_orgs").delete().eq("id", demoOrgId);
}
