"use client";

import { use } from "react";
import { LeadDetail } from "@/components/leads";

interface AdminLeadDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function AdminLeadDetailPage({
  params,
}: AdminLeadDetailPageProps) {
  const { id } = use(params);
  return <LeadDetail leadId={id} role="admin" />;
}
