"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Ticket,
  ListTodo,
  FolderKanban,
  Clock,
  BarChart3,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Tickets",
    href: "/tickets",
    icon: Ticket,
  },
  {
    title: "Tasks",
    href: "/tasks",
    icon: ListTodo,
  },
  {
    title: "Projects",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    title: "Time Logs",
    href: "/time-logs",
    icon: Clock,
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    title: "Users",
    href: "/users",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

interface SidebarNavProps {
  userRole: string;
}

export function SidebarNav({ userRole }: SidebarNavProps) {
  const pathname = usePathname();

  const filteredItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });

  return (
    <nav className="space-y-1">
      {filteredItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
