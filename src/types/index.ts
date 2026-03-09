// Re-export database types for convenience
export type {
  Project,
  ProjectInsert,
  ProjectUpdate,
  Service,
  ServiceInsert,
  ServiceUpdate,
  Client,
  ClientInsert,
  ClientUpdate,
  Stat,
  StatInsert,
  StatUpdate,
  CompanyValue,
  CompanyValueInsert,
  CompanyValueUpdate,
  ContactInfo,
  ContactInfoInsert,
  ContactInfoUpdate,
  AboutContent,
  AboutContentInsert,
  AboutContentUpdate,
  Category,
  CategoryInsert,
  CategoryUpdate,
  Database,
} from './database';

// Application-specific types (not in database)
export interface NavItem {
  label: string;
  href: string;
  key?: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  company?: string;
  service: string;
  message: string;
}

export interface TeamMember {
  name: string;
  role: string;
  image?: string;
}

// E-commerce types
export interface CartItem {
  productId: string;
  name: string;
  image: string;
  variantSku: string;
  size: string;
  quantity: number;
  price: number;
  personalization?: Record<string, string>;
}

export interface ShippingInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  notes?: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  shipping: ShippingInfo;
  subtotal: number;
  shippingCost: number;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered';
  createdAt: string;
}
