import { z } from 'zod';

export const shippingInfoSchema = z.object({
  firstName: z
    .string()
    .min(1, 'სახელი აუცილებელია')
    .max(100, 'სახელი ძალიან გრძელია'),
  lastName: z
    .string()
    .min(1, 'გვარი აუცილებელია')
    .max(100, 'გვარი ძალიან გრძელია'),
  email: z
    .string()
    .min(1, 'ელფოსტა აუცილებელია')
    .email('ელფოსტა არასწორია'),
  phone: z
    .string()
    .min(1, 'ტელეფონი აუცილებელია')
    .regex(/^(\+995|0)?\s?\d{3}\s?\d{2}\s?\d{2}\s?\d{2}$/, 'ტელეფონის ფორმატი არასწორია'),
  address: z
    .string()
    .min(1, 'მისამართი აუცილებელია')
    .max(500, 'მისამართი ძალიან გრძელია'),
  city: z
    .string()
    .min(1, 'ქალაქი აუცილებელია')
    .max(100, 'ქალაქი ძალიან გრძელია'),
  postalCode: z
    .string()
    .min(1, 'საფოსტო კოდი აუცილებელია')
    .max(20, 'საფოსტო კოდი ძალიან გრძელია'),
  notes: z.string().max(1000, 'შენიშვნა ძალიან გრძელია').optional(),
});

export const checkoutRequestSchema = z.object({
  shipping: shippingInfoSchema,
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        name: z.string().min(1),
        variantSku: z.string(),
        size: z.string(),
        quantity: z.number().int().min(1),
        price: z.number().min(0),
        personalization: z.record(z.string(), z.string()).optional(),
      })
    )
    .min(1, 'კალათა ცარიელია'),
  subtotal: z.number().min(0),
  shippingCost: z.number().min(0),
  total: z.number().min(0),
});

export type ShippingInfoForm = z.infer<typeof shippingInfoSchema>;
export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;
