"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Eye, Trash2, Pencil, Plus } from "lucide-react";

interface Bono {
  nombre: string;
  moneda: string;
  valorNominal: number;
  plazo: number;
  fechaEmision: string;
}

function formatCurrency(value: number, currency: string) {
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "S/";
  return `${symbol} ${value.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
  })}`;
}

function formatDate(date: string) {
  const d = new Date(date);
  return d.toLocaleDateString("es-PE");
}

export default function BonosList() {
  const { firebaseUser } = useCurrentUser();
  const [bonos, setBonos] = useState<(Bono & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const eliminarBono = async (bonoId: string) => {
    if (!firebaseUser) return;
    const confirmacion = window.confirm(
      "¿Seguro que deseas eliminar este bono?"
    );
    if (!confirmacion) return;
    setDeletingId(bonoId);
    try {
      await deleteDoc(doc(db, "bonds", bonoId));
      setBonos((prev) => prev.filter((b) => b.id !== bonoId));
      toast.success("Bono eliminado correctamente");
    } catch {
      toast.error("Error al eliminar el bono");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (!firebaseUser) return;

    const fetchBonos = async () => {
      const bonosRef = collection(db, "bonds");
      const q = query(bonosRef, where("userId", "==", firebaseUser.uid));
      const snapshot = await getDocs(q);
      const bonosData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as (Bono & { id: string })[];

      setBonos(bonosData);
      setLoading(false);
    };

    fetchBonos();
  }, [firebaseUser]);

  if (loading)
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="animate-spin h-6 w-6 text-blue-600 mr-2" />
        <span className="text-blue-700 font-medium">Cargando bonos...</span>
      </div>
    );

  if (!firebaseUser) {
    return <p className="p-6 text-center text-gray-500">Cargando sesión...</p>;
  }

  if (bonos.length === 0)
    return (
      <div className="flex flex-col items-center py-12">
        <p className="text-center text-gray-500 mb-4">
          No hay bonos registrados.
        </p>
        <button
          onClick={() => router.push("/bonos/register")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" /> Registrar nuevo bono
        </button>
      </div>
    );

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-end mb-4">
        <button
          onClick={() => router.push("/bonos/register")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" /> Registrar nuevo bono
        </button>
      </div>
      <table className="min-w-full bg-white border border-gray-200 rounded-xl shadow-md">
        <thead className="bg-blue-50 text-gray-800">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Nombre</th>
            <th className="px-4 py-3 text-left font-semibold">Moneda</th>
            <th className="px-4 py-3 text-left font-semibold">VN</th>
            <th className="px-4 py-3 text-left font-semibold">Plazo</th>
            <th className="px-4 py-3 text-left font-semibold">Fecha Emisión</th>
            <th className="px-4 py-3 text-left font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {bonos.map((bono) => (
            <tr
              key={bono.id}
              className="border-t hover:bg-blue-50 transition group"
            >
              <td className="px-4 py-3 font-medium text-gray-900">
                {bono.nombre}
              </td>
              <td className="px-4 py-3">{bono.moneda}</td>
              <td className="px-4 py-3">
                {formatCurrency(bono.valorNominal, bono.moneda)}
              </td>
              <td className="px-4 py-3">{bono.plazo} años</td>
              <td className="px-4 py-3">{formatDate(bono.fechaEmision)}</td>
              <td className="px-4 py-3 flex gap-2 items-center">
                <button
                  title="Ver detalle"
                  onClick={() => router.push(`/bonos/detail/${bono.id}`)}
                  className="p-2 rounded hover:bg-blue-100 text-blue-600 transition"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  title="Editar"
                  onClick={() => router.push(`/bonos/edit/${bono.id}`)}
                  className="p-2 rounded hover:bg-green-100 text-green-600 transition"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  title="Eliminar"
                  onClick={() => eliminarBono(bono.id)}
                  className={`p-2 rounded hover:bg-red-100 text-red-600 transition ${
                    deletingId === bono.id
                      ? "opacity-50 pointer-events-none"
                      : ""
                  }`}
                  disabled={deletingId === bono.id}
                >
                  {deletingId === bono.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
