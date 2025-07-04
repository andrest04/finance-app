"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/firebase/useCurrentUser";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/firebase";

export default function SelectRolePage() {
  const router = useRouter();
  const { firebaseUser, profile, loading } = useCurrentUser();
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && (!firebaseUser || !firebaseUser.uid)) {
      router.replace("/login");
    }
    // Si ya tiene rol, redirigir automáticamente
    if (!loading && profile?.role) {
      if (profile.role === "emisor") {
        router.replace("/emisor/dashboard");
      } else if (profile.role === "inversionista") {
        router.replace("/inversionista/dashboard");
      }
    }
  }, [firebaseUser, profile, loading, router]);

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) {
      setError("Por favor selecciona un rol.");
      return;
    }
    setSaving(true);
    try {
      const userRef = doc(db, "users", firebaseUser!.uid);
      await updateDoc(userRef, { role });
      if (role === "emisor") {
        router.replace("/emisor/dashboard");
      } else {
        router.replace("/inversionista/dashboard");
      }
    } catch {
      setError("Error al guardar el rol. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSaveRole}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">
          Selecciona tu rol
        </h1>
        <select
          className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm mb-4"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="">Selecciona un rol...</option>
          <option value="emisor">Emisor (Empresa)</option>
          <option value="inversionista">Inversionista/Bonista</option>
        </select>
        {error && (
          <div className="text-sm text-red-600 bg-red-100 p-2 rounded-md text-center mb-2">
            {error}
          </div>
        )}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-full transition"
          disabled={saving}
        >
          {saving ? "Guardando..." : "Guardar y continuar"}
        </button>
        <button
          type="button"
          className="w-full mt-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 rounded-full transition"
          onClick={async () => {
            await signOut(auth);
            router.replace("/login");
          }}
        >
          Regresar
        </button>
      </form>
    </div>
  );
}
