"use client";

import { use } from "react";
import { LeadDetail } from "@/components/leads";

interface EditLeadPageProps {
  params: Promise<{ id: string }>;
}

export default function EditLeadPage({ params }: EditLeadPageProps) {
  const { id } = use(params);
  return <LeadDetail leadId={id} role="sales" />;
}
