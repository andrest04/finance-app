"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  limit,
  startAfter,
  DocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Eye,
  Trash2,
  Pencil,
  Plus,
  Search,
  Download,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { exportBonosToPDF } from "@/lib/exportUtils";
import type { BonoData } from "@/lib/bonoUtils";

type Bono = BonoData;

function formatCurrency(value: number, currency: string) {
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "S/";
  return `${symbol} ${value.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
  })}`;
}

function formatDate(date: string | { seconds: number }) {
  if (typeof date === "string") {
    return new Date(date).toLocaleDateString("es-PE");
  }
  return new Date(date.seconds * 1000).toLocaleDateString("es-PE");
}

const BONOS_POR_PAGINA = 10;

export default function BonosList() {
  const { firebaseUser, profile } = useCurrentUser();
  const [bonos, setBonos] = useState<(Bono & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();

  const eliminarBono = async (bonoId: string) => {
    if (!firebaseUser) return;
    const confirmacion = window.confirm(
      "¿Seguro que deseas eliminar este bono? Esta acción no se puede deshacer."
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

  const fetchBonos = async (isNewSearch = false) => {
    if (!firebaseUser) return;
    setLoading(true);

    try {
      let q;
      if (profile?.role === "inversionista") {
        q = query(collection(db, "bonds"), limit(BONOS_POR_PAGINA));
      } else {
        q = query(
          collection(db, "bonds"),
          where("userId", "==", firebaseUser.uid),
          limit(BONOS_POR_PAGINA)
        );
      }

      if (!isNewSearch && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const bonosData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as (Bono & { id: string })[];

      // Ordenar los bonos por fecha de creación en el cliente
      const sortedBonos = bonosData.sort((a, b) => {
        const dateA = typeof a.creadoEn === "object" ? a.creadoEn.seconds : 0;
        const dateB = typeof b.creadoEn === "object" ? b.creadoEn.seconds : 0;
        return dateB - dateA;
      });

      if (isNewSearch) {
        setBonos(sortedBonos);
      } else {
        setBonos((prev) => [...prev, ...sortedBonos]);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === BONOS_POR_PAGINA);
    } catch (error) {
      console.error("Error fetching bonos:", error);
      toast.error("Error al cargar los bonos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBonos(true);
  }, [firebaseUser]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setLastDoc(null);
    setHasMore(true);
    fetchBonos(true);
  };

  const filteredBonos = bonos.filter((bono) =>
    bono.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!firebaseUser) {
    return <p className="p-6 text-center text-gray-500">Cargando sesión...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar bonos..."
            value={searchTerm}
            onChange={handleSearch}
            className="pl-8"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => exportBonosToPDF(bonos)}
            disabled={bonos.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
          {profile?.role === "emisor" && (
            <Button
              onClick={() => router.push("/bonos/register")}
              className="inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Registrar nuevo bono
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin h-6 w-6 text-blue-600 mr-2" />
          <span className="text-blue-700 font-medium">Cargando bonos...</span>
        </div>
      ) : filteredBonos.length === 0 ? (
        <div className="flex flex-col items-center py-12">
          <p className="text-center text-gray-500 mb-4">
            {searchTerm
              ? "No se encontraron bonos que coincidan con la búsqueda."
              : "No hay bonos registrados."}
          </p>
          {!searchTerm && profile?.role === "emisor" && (
            <Button
              onClick={() => router.push("/bonos/register")}
              className="inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Registrar nuevo bono
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-50 text-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                  <th className="px-4 py-3 text-left font-semibold">Moneda</th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Valor Nominal
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">Plazo</th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Tasa Anual
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Fecha Emisión
                  </th>
                  {profile?.role === "inversionista" && (
                    <th className="px-4 py-3 text-left font-semibold">
                      Emisor
                    </th>
                  )}
                  <th className="px-4 py-3 text-left font-semibold">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredBonos.map((bono) => (
                  <tr
                    key={bono.id}
                    className="border-b hover:bg-blue-50 transition"
                  >
                    <td className="px-4 py-2">{bono.nombre}</td>
                    <td className="px-4 py-2">{bono.moneda}</td>
                    <td className="px-4 py-2">
                      {formatCurrency(bono.valorNominal, bono.moneda)}
                    </td>
                    <td className="px-4 py-2">{bono.plazo} años</td>
                    <td className="px-4 py-2">{bono.tasaAnual}%</td>
                    <td className="px-4 py-2">
                      {formatDate(bono.fechaEmision)}
                    </td>
                    {profile?.role === "inversionista" && (
                      <td className="px-4 py-2">{bono.emisorNombre || "-"}</td>
                    )}
                    <td className="px-4 py-2 flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => router.push(`/bonos/detail/${bono.id}`)}
                        title="Ver Detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {profile?.role !== "inversionista" && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              router.push(`/bonos/edit/${bono.id}`)
                            }
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => eliminarBono(bono.id)}
                            title="Eliminar"
                            disabled={deletingId === bono.id}
                          >
                            {deletingId === bono.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                onClick={() => fetchBonos(false)}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  "Cargar más"
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
