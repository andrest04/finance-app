"use client";

import { useCurrentUser } from "@/lib/firebase/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { toast } from "sonner";
import Image from "next/image";
import ProtectedRoute from "@/components/auth/RouteGuard";

export default function ProfilePage() {
  const { profile, firebaseUser } = useCurrentUser();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: profile?.firstName || "",
    lastName: profile?.lastName || "",
    email: firebaseUser?.email || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;

    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      await updateDoc(userRef, {
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      toast.success("Perfil actualizado correctamente");
      setIsEditing(false);
    } catch (error) {
      console.error("Error al actualizar:", error);
      toast.error("Error al actualizar el perfil");
    }
  };

  return (
    <ProtectedRoute requiredRole={undefined}>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Mi Perfil</h1>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-6 mb-8">
            <div className="relative">
              {firebaseUser?.photoURL ? (
                <Image
                  src={firebaseUser.photoURL}
                  alt="Perfil"
                  width={120}
                  height={120}
                  className="rounded-full border-4 border-blue-100 object-cover"
                />
              ) : (
                <Image
                  src="/avatar.png"
                  alt="Avatar por defecto"
                  width={120}
                  height={120}
                  className="rounded-full border-4 border-blue-100 object-cover"
                />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-semibold">
                {profile
                  ? `${profile.firstName} ${profile.lastName}`
                  : "Cargando..."}
              </h2>
              <p className="text-gray-600">{firebaseUser?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label>Apellido</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label>Correo electrónico</Label>
                <Input value={formData.email} disabled />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              {isEditing ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        firstName: profile?.firstName || "",
                        lastName: profile?.lastName || "",
                        email: firebaseUser?.email || "",
                      });
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">Guardar cambios</Button>
                </>
              ) : (
                <Button type="button" onClick={() => setIsEditing(true)}>
                  Editar perfil
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
