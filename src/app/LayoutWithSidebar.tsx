"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/ui/Sidebar";
import { useEffect, useState } from "react";

function useIsClient() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  return isClient;
}

export default function LayoutWithSidebar({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isClient = useIsClient();

  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/select-role");

  if (isPublic) {
    return <>{children}</>;
  }

  if (!isClient) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-h-screen bg-gray-50 p-6">{children}</main>
    </div>
  );
}
