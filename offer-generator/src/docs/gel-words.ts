// Georgian integer-to-words for GEL amounts on contracts/invoices (the legal
// "sum in words" convention). Vigesimal (base-20) system. Covers 0–999,999,
// which comfortably exceeds any offer total.

const UNITS = [
  "",
  "ერთი",
  "ორი",
  "სამი",
  "ოთხი",
  "ხუთი",
  "ექვსი",
  "შვიდი",
  "რვა",
  "ცხრა",
  "ათი",
  "თერთმეტი",
  "თორმეტი",
  "ცამეტი",
  "თოთხმეტი",
  "თხუთმეტი",
  "თექვსმეტი",
  "ჩვიდმეტი",
  "თვრამეტი",
  "ცხრამეტი",
];

// base form (multiple of 20) and the combining prefix (Xოცდა) for the +1..19 case
const TENS_BASE: Record<number, string> = {
  20: "ოცი",
  40: "ორმოცი",
  60: "სამოცი",
  80: "ოთხმოცი",
};
const TENS_PREFIX: Record<number, string> = {
  20: "ოცდა",
  40: "ორმოცდა",
  60: "სამოცდა",
  80: "ოთხმოცდა",
};

const HUNDREDS = [
  "",
  "ასი",
  "ორასი",
  "სამასი",
  "ოთხასი",
  "ხუთასი",
  "ექვსასი",
  "შვიდასი",
  "რვაასი",
  "ცხრაასი",
];
// combining form (drops final ი) when followed by a remainder
const HUNDREDS_COMB = [
  "",
  "ას",
  "ორას",
  "სამას",
  "ოთხას",
  "ხუთას",
  "ექვსას",
  "შვიდას",
  "რვაას",
  "ცხრაას",
];

function under100(n: number): string {
  if (n < 20) return UNITS[n];
  const base = Math.floor(n / 20) * 20; // 20, 40, 60, 80
  const rem = n - base;
  if (rem === 0) return TENS_BASE[base];
  return TENS_PREFIX[base] + UNITS[rem];
}

function under1000(n: number): string {
  if (n < 100) return under100(n);
  const h = Math.floor(n / 100);
  const rem = n % 100;
  if (rem === 0) return HUNDREDS[h];
  return `${HUNDREDS_COMB[h]} ${under100(rem)}`;
}

/** Georgian words for a non-negative integer (0–999,999). */
export function gelWords(n: number): string {
  const v = Math.floor(Math.abs(n));
  if (v === 0) return "ნული";
  const th = Math.floor(v / 1000);
  const rem = v % 1000;
  if (th === 0) return under1000(v);
  const thWord =
    th === 1
      ? rem === 0
        ? "ათასი"
        : "ათას"
      : `${under1000(th)} ${rem === 0 ? "ათასი" : "ათას"}`;
  if (rem === 0) return thWord;
  return `${thWord} ${under1000(rem)}`;
}
