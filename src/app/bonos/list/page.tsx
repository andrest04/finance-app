"use client";

import BonoListEnhanced from "@/components/bonos/BonoListEnhanced";
import ProtectedRoute from "@/components/auth/RouteGuard";

export default function ListaBonosPage() {
  return (
    <ProtectedRoute requiredRole={undefined}>
      <div className="p-6 max-w-7xl mx-auto">
        <BonoListEnhanced />
      </div>
    </ProtectedRoute>
  );
}
