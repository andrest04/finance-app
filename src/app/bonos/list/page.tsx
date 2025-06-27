"use client";

import BonoList from "@/components/bonos/BonoList";
import ProtectedRoute from "@/components/auth/RouteGuard";

export default function ListaBonosPage() {
  return (
    <ProtectedRoute requiredRole={undefined}>
      <div className="p-6 max-w-7xl mx-auto">
        <BonoList />
      </div>
    </ProtectedRoute>
  );
}
