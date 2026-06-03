import { AdminLayoutContent } from './AdminLayoutContent';
import { requirePageRole } from '@/lib/require-page-role';

export const metadata = {
  title: 'Admin Panel | ALLONE',
  description: 'Manage your website content',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePageRole(['admin'], {
    loginPrefix: '/admin/login',
    loginPath: '/admin/login',
    deniedPath: '/',
  });
  return <AdminLayoutContent>{children}</AdminLayoutContent>;
}
