"use client";

import { PageHeader } from "@/components/admin";
import { TaskQueue } from "@/components/leads";

export default function FollowUpsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <PageHeader
        title="Follow-ups"
        description="Your scheduled follow-up tasks"
      />
      <TaskQueue scope="due" />
    </div>
  );
}
