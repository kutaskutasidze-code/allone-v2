import { AdminLayoutContent } from './AdminLayoutContent';

export const metadata = {
  title: 'Admin Panel | ALLONE',
  description: 'Manage your website content',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutContent>{children}</AdminLayoutContent>;
}
