export interface Recipient {
  name: string;
  id_code?: string;
  address?: string;
  representative?: string;
}

export const ISSUER = {
  name_ka: 'შპს „ოლუან"',
  name_en: "AllOne",
  id_code: "405826361",
  address_ka: "საქართველო, თბილისი, რაიონი საბურთალო, ტაშკენტის ქ. N 10ა ბ. 6ა",
  director: "ნინო მესხიძე",
  bank: 'სს „საქართველოს ბანკი"',
  iban: "GE82BG0000000612104254",
  email: "luka.adamia@allonelabs.com",
  website: "allone.ge",
} as const;

export function issuerName(language: string): string {
  return language === "en" ? ISSUER.name_en : ISSUER.name_ka;
}
