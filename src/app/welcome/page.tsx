// app/welcome/page.tsx

"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

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
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">
        Bienvenido, {user?.displayName || "Usuario"} 👋
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Resumen */}
        <div className="p-4 border rounded-xl shadow bg-white">
          <h2 className="text-lg font-semibold mb-2">Resumen general</h2>
          <p className="text-gray-700">
            Bonos registrados: <span className="font-bold">{bonoCount}</span>
          </p>
        </div>

        {/* Accesos rápidos */}
        <div className="p-4 border rounded-xl shadow bg-white">
          <h2 className="text-lg font-semibold mb-2">Accesos rápidos</h2>
          <ul className="space-y-2">
            <li>
              <Link
                href="/bonos/register"
                className="text-blue-600 hover:underline"
              >
                ➕ Registrar nuevo bono
              </Link>
            </li>
            <li>
              <Link
                href="/bonos/list"
                className="text-blue-600 hover:underline"
              >
                📋 Ver lista de bonos
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
