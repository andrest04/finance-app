"use client";

import BonoListEnhanced from "@/components/ui/BonoListEnhanced";
import ProtectedRoute from "@/components/RouteGuard";

export default function ListaBonosPage() {
  return (
    <ProtectedRoute requiredRole={undefined}>
      <div className="p-6 max-w-7xl mx-auto">
        <BonoListEnhanced />
      </div>
    </ProtectedRoute>
  );
}
