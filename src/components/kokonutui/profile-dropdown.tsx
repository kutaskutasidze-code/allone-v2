"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Settings, LayoutDashboard, LogOut, User } from "lucide-react";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Profile {
    name: string;
    email: string;
}

interface MenuItem {
    label: string;
    value?: string;
    href?: string;
    icon: React.ReactNode;
    onClick?: () => void;
    danger?: boolean;
}

interface ProfileDropdownProps extends React.HTMLAttributes<HTMLDivElement> {
    profile: Profile;
    menuItems?: MenuItem[];
    onSignOut?: () => void;
    glass?: boolean;
}

export default function ProfileDropdown({
    profile,
    menuItems,
    onSignOut,
    glass = false,
    className,
    ...props
}: ProfileDropdownProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    const defaultItems: MenuItem[] = menuItems ?? [
        {
            label: "Dashboard",
            href: "/dashboard",
            icon: <LayoutDashboard className="w-4 h-4" />,
        },
        {
            label: "Settings",
            href: "/dashboard",
            icon: <Settings className="w-4 h-4" />,
        },
    ];

    return (
        <div className={cn("relative", className)} {...props}>
            <DropdownMenu onOpenChange={setIsOpen}>
                <div className="group relative">
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className={cn(
                                "flex items-center gap-2 py-1.5 px-3 rounded-full transition-all duration-200 focus:outline-none",
                                glass
                                    ? "bg-white/70 backdrop-blur-md hover:bg-white/90 shadow-sm"
                                    : "bg-white border border-zinc-200/60 hover:border-zinc-300 hover:bg-zinc-50/80 hover:shadow-sm"
                            )}
                        >
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center">
                                <User className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="text-sm font-medium text-zinc-900 max-w-[80px] truncate">
                                {profile.name}
                            </span>
                        </button>
                    </DropdownMenuTrigger>

                    {/* Bending line indicator */}
                    <div
                        className={cn(
                            "absolute -right-2.5 top-1/2 -translate-y-1/2 transition-all duration-200",
                            isOpen
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-60"
                        )}
                    >
                        <svg
                            width="10"
                            height="20"
                            viewBox="0 0 12 24"
                            fill="none"
                            className={cn(
                                "transition-all duration-200",
                                isOpen
                                    ? "text-zinc-600 scale-110"
                                    : "text-zinc-400 group-hover:text-zinc-500"
                            )}
                            aria-hidden="true"
                        >
                            <path
                                d="M2 4C6 8 6 16 2 20"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                fill="none"
                            />
                        </svg>
                    </div>

                    <DropdownMenuContent
                        align="end"
                        sideOffset={8}
                        className={cn(
                            "w-60 p-2 rounded-2xl shadow-xl",
                            "data-[state=open]:animate-in data-[state=closed]:animate-out",
                            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                            "data-[side=bottom]:slide-in-from-top-2",
                            "origin-top-right",
                            glass
                                ? "bg-white/60 backdrop-blur-2xl border border-white/40 shadow-black/[0.08]"
                                : "bg-white/95 backdrop-blur-sm border border-zinc-200/60 shadow-zinc-900/5"
                        )}
                    >
                        {/* Profile info header */}
                        <div className="px-3 py-2.5 mb-1">
                            <p className="text-sm font-medium text-zinc-900 truncate">{profile.name}</p>
                            <p className="text-xs text-zinc-500 truncate">{profile.email}</p>
                        </div>

                        <DropdownMenuSeparator className="bg-gradient-to-r from-transparent via-zinc-200/80 to-transparent" />

                        <div className="space-y-0.5 mt-1">
                            {defaultItems.filter(i => !i.danger).map((item) => (
                                <DropdownMenuItem key={item.label} asChild>
                                    {item.href ? (
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 cursor-pointer group",
                                                glass
                                                    ? "hover:bg-white/40 hover:shadow-sm"
                                                    : "hover:bg-zinc-100/80 hover:shadow-sm hover:border-zinc-200/50"
                                            )}
                                        >
                                            <span className="text-zinc-500 group-hover:text-zinc-700 transition-colors">{item.icon}</span>
                                            <span className="text-sm font-medium text-zinc-700 group-hover:text-zinc-900 transition-colors">
                                                {item.label}
                                            </span>
                                            {item.value && (
                                                <span className="ml-auto text-xs font-medium text-zinc-500 bg-zinc-100 rounded-md py-0.5 px-1.5">
                                                    {item.value}
                                                </span>
                                            )}
                                        </Link>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={item.onClick}
                                            className={cn(
                                                "w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 cursor-pointer group",
                                                glass
                                                    ? "hover:bg-white/40 hover:shadow-sm"
                                                    : "hover:bg-zinc-100/80 hover:shadow-sm"
                                            )}
                                        >
                                            <span className="text-zinc-500 group-hover:text-zinc-700 transition-colors">{item.icon}</span>
                                            <span className="text-sm font-medium text-zinc-700 group-hover:text-zinc-900 transition-colors">
                                                {item.label}
                                            </span>
                                        </button>
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </div>

                        {onSignOut && (
                            <>
                                <DropdownMenuSeparator className="bg-gradient-to-r from-transparent via-zinc-200/80 to-transparent my-1.5" />
                                <DropdownMenuItem asChild>
                                    <button
                                        type="button"
                                        onClick={onSignOut}
                                        className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-red-500/8 hover:bg-red-500/15 cursor-pointer transition-all duration-200 group hover:shadow-sm"
                                    >
                                        <LogOut className="w-4 h-4 text-red-500 group-hover:text-red-600" />
                                        <span className="text-sm font-medium text-red-500 group-hover:text-red-600">
                                            Sign Out
                                        </span>
                                    </button>
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </div>
            </DropdownMenu>
        </div>
    );
}
