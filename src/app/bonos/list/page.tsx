"use client";

import BonosList from "@/components/ui/BonoList";
import ProtectedRoute from "@/components/RouteGuard";
import { useCurrentUser } from "@/lib/useCurrentUser";

export default function ListaBonosPage() {
  const { profile } = useCurrentUser();

  return (
    <ProtectedRoute requiredRole={undefined}>
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">
          {profile?.role === "emisor"
            ? "Mis Bonos Registrados"
            : "Bonos Disponibles"}
        </h1>
        <BonosList />
      </div>
    </ProtectedRoute>
  );
}
