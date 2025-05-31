"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { useRouter } from "next/navigation";

interface Bono {
  nombre: string;
  moneda: string;
  valorNominal: number;
  plazo: number;
  fechaEmision: string;
}

export default function BonosList() {
  const { firebaseUser } = useCurrentUser();
  const [bonos, setBonos] = useState<(Bono & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const eliminarBono = async (bonoId: string) => {
    if (!firebaseUser) return;
    const confirmacion = window.confirm(
      "¿Seguro que deseas eliminar este bono?"
    );
    if (!confirmacion) return;

    await deleteDoc(doc(db, "usuarios", firebaseUser.uid, "bonos", bonoId));
    setBonos((prev) => prev.filter((b) => b.id !== bonoId));
  };

  useEffect(() => {
    if (!firebaseUser) return;

    const fetchBonos = async () => {
      const bonosRef = collection(db, "usuarios", firebaseUser.uid, "bonos");
      const snapshot = await getDocs(bonosRef);
      const bonosData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as (Bono & { id: string })[];

      setBonos(bonosData);
      setLoading(false);
    };

    fetchBonos();
  }, [firebaseUser]);

  if (loading) return <p className="text-center">Cargando bonos...</p>;

  if (!firebaseUser) {
    return <p className="p-6 text-center text-gray-500">Cargando sesión...</p>;
  }

  if (bonos.length === 0)
    return <p className="text-center">No hay bonos registrados.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-300 rounded-md shadow-sm">
        <thead className="bg-blue-100 text-gray-800">
          <tr>
            <th className="px-4 py-2 text-left">Nombre</th>
            <th className="px-4 py-2 text-left">Moneda</th>
            <th className="px-4 py-2 text-left">VN</th>
            <th className="px-4 py-2 text-left">Plazo</th>
            <th className="px-4 py-2 text-left">Fecha Emisión</th>
            <th className="px-4 py-2 text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {bonos.map((bono, i) => (
            <tr key={i} className="border-t">
              <td className="px-4 py-2">{bono.nombre}</td>
              <td className="px-4 py-2">{bono.moneda}</td>
              <td className="px-4 py-2">
                S/. {bono.valorNominal.toLocaleString()}
              </td>
              <td className="px-4 py-2">{bono.plazo} años</td>
              <td className="px-4 py-2">{bono.fechaEmision}</td>
              <td className="px-4 py-2 space-x-2">
                <button
                  onClick={() => router.push(`/bonos/detail/${bono.id}`)}
                  className="text-blue-600 hover:underline"
                >
                  Ver detalle
                </button>
                <button
                  onClick={() => eliminarBono(bono.id)}
                  className="text-red-600 hover:underline"
                >
                  Eliminar
                </button>
                <button
                  onClick={() => router.push(`/bonos/edit/${bono.id}`)}
                  className="text-green-600 hover:underline"
                >
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
