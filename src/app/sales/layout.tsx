import { SalesLayoutContent } from './SalesLayoutContent';
import { requirePageRole } from '@/lib/require-page-role';

export default async function SalesLayout({ children }: { children: React.ReactNode }) {
  await requirePageRole(['admin', 'supervisor', 'salesperson'], {
    loginPrefix: '/sales/login',
    loginPath: '/sales/login?error=not_sales_user',
    deniedPath: '/sales/login?error=not_sales_user',
  });
  return <SalesLayoutContent>{children}</SalesLayoutContent>;
}
