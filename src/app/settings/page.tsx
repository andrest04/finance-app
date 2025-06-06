"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { firebaseUser } = useCurrentUser();
  const [settings, setSettings] = useState({
    currency: "PEN",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      if (!firebaseUser) {
        setIsLoading(false);
        return;
      }
      try {
        const settingsRef = doc(
          db,
          "users",
          firebaseUser.uid,
          "settings",
          "preferences"
        );
        const settingsDoc = await getDoc(settingsRef);
        if (settingsDoc.exists()) {
          setSettings(settingsDoc.data() as { currency: string });
        }
      } catch (err) {
        console.error("Error loading settings:", err);
        toast.error("Error al cargar la configuración");
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, [firebaseUser]);

  const handleSave = async () => {
    if (!firebaseUser) {
      toast.error("Debes iniciar sesión para guardar la configuración");
      return;
    }
    try {
      const settingsRef = doc(
        db,
        "users",
        firebaseUser.uid,
        "settings",
        "preferences"
      );
      await setDoc(settingsRef, settings);
      toast.success("Configuración guardada correctamente");
    } catch (err) {
      console.error("Error saving settings:", err);
      toast.error("Error al guardar la configuración");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex justify-center items-center min-h-[40vh]">
        <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center w-full">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600 mb-2" />
          <span className="text-gray-700 font-medium">
            Cargando configuración...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Configuración</h1>
      <div className="grid gap-8">
        {/* Preferencias */}
        <section className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-2xl font-semibold mb-6">Preferencias</h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="currency">Moneda</Label>
              <Select
                value={settings.currency}
                onValueChange={(value) =>
                  setSettings({ ...settings, currency: value })
                }
              >
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Selecciona una moneda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PEN">Soles (PEN)</SelectItem>
                  <SelectItem value="USD">Dólares (USD)</SelectItem>
                  <SelectItem value="EUR">Euros (EUR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>
        {/* Acciones */}
        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={() => setSettings({ currency: "PEN" })}
          >
            Restaurar valores predeterminados
          </Button>
          <Button onClick={handleSave}>Guardar cambios</Button>
        </div>
      </div>
    </div>
  );
}
