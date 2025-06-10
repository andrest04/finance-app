"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/useCurrentUser";

export default function Home() {
  const router = useRouter();
  const { firebaseUser, profile, loading } = useCurrentUser();

  useEffect(() => {
    console.log("[DEBUG] Estado de autenticación:", {
      firebaseUser,
      profile,
      loading,
    });
    if (loading) return;
    if (!firebaseUser) {
      console.log("[DEBUG] Usuario no autenticado, redirigiendo a /login");
      router.replace("/login");
      return;
    }
    if (!profile?.role) {
      console.log(
        "[DEBUG] Usuario autenticado pero sin rol, redirigiendo a /select-role"
      );
      router.replace("/select-role");
      return;
    }
    if (profile.role === "emisor") {
      console.log("[DEBUG] Usuario emisor, redirigiendo a /emisor/dashboard");
      router.replace("/emisor/dashboard");
    } else if (profile.role === "inversionista") {
      console.log(
        "[DEBUG] Usuario inversionista, redirigiendo a /inversionista/dashboard"
      );
      router.replace("/inversionista/dashboard");
    } else {
      console.log("[DEBUG] Rol desconocido, redirigiendo a /login");
      router.replace("/login"); // fallback
    }
  }, [firebaseUser, profile, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Cargando...</h1>
      </div>
    </div>
  );
}
