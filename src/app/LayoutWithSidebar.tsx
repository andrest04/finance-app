"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/ui/Sidebar";

export default function LayoutWithSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isPublic = pathname.startsWith("/login") || pathname.startsWith("/register");

  if (isPublic) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-gray-50 p-6">{children}</main>
    </div>
  );
}
