"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/useCurrentUser";

interface ProtectedRouteProps {
  requiredRole?: "emisor" | "inversionista";
  children: React.ReactNode;
}

export default function ProtectedRoute({
  requiredRole,
  children,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { firebaseUser, profile, loading } = useCurrentUser();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    console.log("RouteGuard - Current state:", {
      firebaseUser: firebaseUser ? "exists" : "null",
      profile: profile ? "exists" : "null",
      requiredRole,
      loading,
    });

    if (loading) {
      console.log("RouteGuard - Still loading");
      return;
    }

    if (firebaseUser === null) {
      console.log("RouteGuard - No user, redirecting to login");
      setIsRedirecting(true);
      router.replace("/login");
    } else if (
      requiredRole &&
      profile &&
      profile.role &&
      profile.role !== requiredRole
    ) {
      console.log(
        "RouteGuard - Wrong role, redirecting to appropriate dashboard"
      );
      setIsRedirecting(true);
      if (profile.role === "emisor") {
        router.replace("/emisor/welcome");
      } else {
        router.replace("/inversionista/welcome");
      }
    } else {
      console.log("RouteGuard - Access granted");
      setIsRedirecting(false);
    }
  }, [firebaseUser, profile, requiredRole, router, loading]);

  // Mientras se carga o se está redirigiendo, mostrar un indicador de carga
  if (loading || isRedirecting || !firebaseUser || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si el rol es correcto o no se requiere rol, mostrar el contenido
  if (!requiredRole || profile.role === requiredRole) {
    return <>{children}</>;
  }

  // Si no, ya habrá redirigido
  return null;
}
