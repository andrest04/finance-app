"use client";

import BonoStats from "@/components/ui/BonoStats";
import ProtectedRoute from "@/components/RouteGuard";

export default function EstadisticasPage() {
  return (
    <ProtectedRoute requiredRole={undefined}>
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          Estadísticas de Bonos
        </h1>
        <BonoStats />
      </div>
    </ProtectedRoute>
  );
}
