"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/useCurrentUser";

interface ProtectedRouteProps {
  requiredRole: "emisor" | "inversionista";
  children: React.ReactNode;
}

export default function ProtectedRoute({
  requiredRole,
  children,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { firebaseUser, profile } = useCurrentUser();

  useEffect(() => {
    if (firebaseUser === null) {
      // No autenticado
      router.replace("/login");
    } else if (profile && profile.role && profile.role !== requiredRole) {
      // Rol incorrecto
      if (profile.role === "emisor") {
        router.replace("/emisor/dashboard");
      } else {
        router.replace("/inversionista/dashboard");
      }
    }
  }, [firebaseUser, profile, requiredRole, router]);

  // Mientras se carga el usuario, no mostrar nada
  if (!firebaseUser || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Cargando...
      </div>
    );
  }

  // Si el rol es correcto, mostrar el contenido
  if (profile.role === requiredRole) {
    return <>{children}</>;
  }

  // Si no, ya habrá redirigido
  return null;
}
