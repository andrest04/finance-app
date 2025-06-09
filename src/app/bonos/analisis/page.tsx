"use client";

import ComparadorBonos from "@/components/ui/ComparadorBonos";
import ProtectedRoute from "@/components/RouteGuard";

export default function AnalisisBonosPage() {
  return (
    <ProtectedRoute requiredRole={undefined}>
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          Análisis de Bonos
        </h1>
        <ComparadorBonos />
      </div>
    </ProtectedRoute>
  );
}
