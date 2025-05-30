"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCurrentUser } from "@/lib/useCurrentUser";

interface Bono {
  nombre: string;
  moneda: string;
  valorNominal: number;
  plazo: number;
  fechaEmision: string;
}

export default function BonosList() {
  const { firebaseUser } = useCurrentUser();
  const [bonos, setBonos] = useState<Bono[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBonos = async () => {
      if (!firebaseUser) return;

      const bonosRef = collection(db, "usuarios", firebaseUser.uid, "bonos");
      const snapshot = await getDocs(bonosRef);
      const bonosData = snapshot.docs.map((doc) => doc.data() as Bono);
      setBonos(bonosData);
      setLoading(false);
    };

    fetchBonos();
  }, [firebaseUser]);

  if (loading) return <p className="text-center">Cargando bonos...</p>;

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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
