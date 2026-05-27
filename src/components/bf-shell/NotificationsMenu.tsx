"use client";
import Link from "next/link";
import { Bell } from "lucide-react";

// Bell icon that links to the audit log. BF has a real notification feed;
// for v1 we just route to /sales/notifications.
export function NotificationsMenu() {
  return (
    <Link
      href="/sales/notifications"
      title="Notifications"
      aria-label="Notifications"
      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--ink-700)] transition hover:bg-[var(--bg-sunken)]"
    >
      <Bell className="h-4 w-4" />
    </Link>
  );
}
