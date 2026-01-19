import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SignOutButton } from "./dashboard/sign-out-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-gray-800">
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/seaversity-logo.png"
              alt="Seaversity Logo"
              width={110}
              height={36}
              priority
              className="h-auto w-auto"
            />
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {session.user.name || session.user.email}
            </span>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              {session.user.role}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 flex-col border-r bg-white dark:bg-gray-800 min-h-[calc(100vh-4rem)]">
          <div className="flex-1 overflow-y-auto p-4">
            <SidebarNav userRole={session.user.role} />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
