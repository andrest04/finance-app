// app/welcome/page.tsx

"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { UserCircle, BarChart2, PlusCircle, List } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [bonoCount, setBonoCount] = useState(0);

  useEffect(() => {
    const fetchBonos = async () => {
      if (user) {
        const bonosRef = collection(db, `usuarios/${user.uid}/bonos`);
        const snapshot = await getDocs(bonosRef);
        setBonoCount(snapshot.size);
      }
    };

    fetchBonos();
  }, [user]);

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="w-full max-w-3xl mx-auto space-y-8 pt-10 pb-8">
        {/* Tarjeta de bienvenida */}
        <div className="flex flex-col sm:flex-row items-center gap-6 bg-white/90 rounded-2xl shadow-lg p-6 border border-blue-100">
          <div className="flex-shrink-0">
            <div className="bg-blue-100 rounded-full p-2">
              <UserCircle className="w-16 h-16 text-blue-500" />
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl font-bold text-blue-800 mb-1 animate-fade-in">
              ¡Bienvenido, {user?.displayName || "Usuario"}!
            </h1>
            <p className="text-gray-600 text-lg">
              Nos alegra tenerte de vuelta en tu panel financiero.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Resumen */}
          <div className="col-span-1 flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl shadow p-6 border border-blue-200">
            <BarChart2 className="w-10 h-10 text-blue-600 mb-2" />
            <span className="text-4xl font-extrabold text-blue-800 mb-1">
              {bonoCount}
            </span>
            <span className="text-gray-700 font-medium">Bonos registrados</span>
          </div>

          {/* Accesos rápidos */}
          <div className="col-span-2 flex flex-col gap-4 justify-center">
            <h2 className="text-xl font-semibold text-blue-700 mb-2">
              Accesos rápidos
            </h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/bonos/register"
                className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition text-lg font-semibold"
              >
                <PlusCircle className="w-6 h-6" /> Registrar nuevo bono
              </Link>
              <Link
                href="/bonos/list"
                className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-blue-50 text-blue-700 rounded-xl shadow hover:bg-blue-100 transition text-lg font-semibold border border-blue-200"
              >
                <List className="w-6 h-6" /> Ver lista de bonos
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
