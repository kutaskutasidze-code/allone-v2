import { redirect } from 'next/navigation';
import { checkSalesAuth } from '@/lib/sales-auth';
import { TeamContent } from './TeamContent';

export default async function SalesTeamPage() {
  const auth = await checkSalesAuth();
  if (!auth) redirect('/sales/login');
  if (auth.salesUser.role !== 'supervisor') redirect('/sales');

  return <TeamContent supervisorName={auth.salesUser.name} />;
}
