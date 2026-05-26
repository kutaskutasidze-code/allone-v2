// Ecom-segment seed data: products, customers, orders, stock movements.
// Matches BF's ecom-forge schema shape (products, customers, orders,
// stock_movements), all scoped by org_id.

import { demosSupabase } from "../../database/demos-client.js";
import { logger } from "../../utils/logger.js";
import type { CompanySpec } from "../../types/demo.js";

export interface EcomSeedResult {
  products: number;
  customers: number;
  orders: number;
  stock_movements: number;
}

const PRODUCT_NAMES = [
  "Linen Field Shirt — Sand",
  "Organic Cotton Tee — Slate",
  "Recycled Wool Crew — Moss",
  "Hemp Drawstring Pant — Ink",
  "Merino Lounge Hoodie — Stone",
  "Tencel Wrap Dress — Ash",
  "Bamboo Lounge Set — Clay",
  "Cashmere Beanie — Bone",
];
const PRODUCT_PRICES_EUR = [62, 38, 145, 88, 165, 198, 110, 75];
const PRODUCT_STOCK = [42, 128, 18, 67, 24, 11, 33, 89];

const CUSTOMER_FIRST = ["Sophie", "Lars", "Marta", "Jonas", "Camille"];
const CUSTOMER_LAST = ["Andersen", "Bauer", "Costa", "Dvorak", "Mercier"];
const CUSTOMER_COUNTRIES = ["DK", "DE", "IT", "CZ", "FR"];

const ORDER_STATUSES = [
  "paid",
  "fulfilled",
  "shipped",
  "pending",
  "refunded",
] as const;

export async function seedEcom(
  demoOrgId: string,
  company: CompanySpec,
): Promise<EcomSeedResult> {
  const db = demosSupabase();
  const result: EcomSeedResult = {
    products: 0,
    customers: 0,
    orders: 0,
    stock_movements: 0,
  };

  await db.from("demo_orgs").upsert({
    id: demoOrgId,
    name: company.name,
    brand_color: company.color ?? "#0ea5e9",
    brand_logo: company.logo ?? null,
    segment: "ecom",
    seeded_at: new Date().toISOString(),
  });

  // Products
  const products = PRODUCT_NAMES.map((name, i) => ({
    org_id: demoOrgId,
    name,
    sku: `${(company.name || "X").slice(0, 3).toUpperCase()}-${1000 + i * 7}`,
    price_eur: PRODUCT_PRICES_EUR[i],
    stock: PRODUCT_STOCK[i],
    is_active: true,
  }));
  const { data: productRows, error: productErr } = await db
    .from("products")
    .insert(products)
    .select("id, sku, price_eur");
  if (productErr) {
    logger.warn("seedEcom: products insert failed", {
      error: productErr.message,
    });
  } else {
    result.products = productRows?.length ?? 0;
  }

  // Customers
  const customers = CUSTOMER_FIRST.map((first, i) => ({
    org_id: demoOrgId,
    name: `${first} ${CUSTOMER_LAST[i]}`,
    email: `${first.toLowerCase()}@${CUSTOMER_LAST[i].toLowerCase()}.example`,
    country: CUSTOMER_COUNTRIES[i],
    lifetime_value_eur: (i + 1) * 320,
  }));
  const { data: customerRows, error: customerErr } = await db
    .from("customers")
    .insert(customers)
    .select("id");
  if (customerErr) {
    logger.warn("seedEcom: customers insert failed", {
      error: customerErr.message,
    });
  } else {
    result.customers = customerRows?.length ?? 0;
  }

  // Orders — 15 spread across last 30 days
  const orders = [];
  const now = Date.now();
  for (let i = 0; i < 15; i++) {
    const productIdx = i % PRODUCT_NAMES.length;
    const customerIdx = i % CUSTOMER_FIRST.length;
    const daysAgo = i * 1.8;
    const qty = 1 + (i % 3);
    const product = productRows?.[productIdx];
    orders.push({
      org_id: demoOrgId,
      product_id: product?.id ?? null,
      customer_id: customerRows?.[customerIdx]?.id ?? null,
      qty,
      total_eur: (product?.price_eur ?? 50) * qty,
      status: ORDER_STATUSES[i % ORDER_STATUSES.length],
      created_at: new Date(now - daysAgo * 86400_000).toISOString(),
    });
  }
  const { error: orderErr } = await db.from("orders").insert(orders);
  if (orderErr) {
    logger.warn("seedEcom: orders insert failed", { error: orderErr.message });
  } else {
    result.orders = orders.length;
  }

  // Stock movements
  const movements = [];
  for (let i = 0; i < productRows!.length; i++) {
    movements.push({
      org_id: demoOrgId,
      product_id: productRows![i].id,
      delta: -(2 + (i % 5)),
      reason: "demo.fulfillment",
      occurred_at: new Date(now - i * 6 * 3600_000).toISOString(),
    });
  }
  const { error: stockErr } = await db
    .from("stock_movements")
    .insert(movements);
  if (stockErr) {
    logger.warn("seedEcom: stock_movements insert failed", {
      error: stockErr.message,
    });
  } else {
    result.stock_movements = movements.length;
  }

  return result;
}

export async function unseedEcom(demoOrgId: string): Promise<void> {
  const db = demosSupabase();
  await db.from("stock_movements").delete().eq("org_id", demoOrgId);
  await db.from("orders").delete().eq("org_id", demoOrgId);
  await db.from("customers").delete().eq("org_id", demoOrgId);
  await db.from("products").delete().eq("org_id", demoOrgId);
  await db.from("demo_orgs").delete().eq("id", demoOrgId);
}
