"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
import { Card } from "@/components/ui/card";

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
  const { firebaseUser, profile, loading: userLoading } = useCurrentUser();
  const [state, setState] = useState<{
    bonos: (Bono & { id: string })[];
    loading: boolean;
    deletingId: string | null;
    searchTerm: string;
    lastDoc: DocumentSnapshot | null;
    hasMore: boolean;
    error: string | null;
  }>({
    bonos: [],
    loading: false,
    deletingId: null,
    searchTerm: "",
    lastDoc: null,
    hasMore: true,
    error: null,
  });

  const router = useRouter();

  const eliminarBono = async (bonoId: string) => {
    if (!firebaseUser) return;
    const confirmacion = window.confirm(
      "¿Seguro que deseas eliminar este bono? Esta acción no se puede deshacer."
    );
    if (!confirmacion) return;

    setState((prev) => ({ ...prev, deletingId: bonoId }));
    try {
      await deleteDoc(doc(db, "bonds", bonoId));
      setState((prev) => ({
        ...prev,
        bonos: prev.bonos.filter((b) => b.id !== bonoId),
        deletingId: null,
      }));
      toast.success("Bono eliminado correctamente");
    } catch {
      toast.error("Error al eliminar el bono");
      setState((prev) => ({ ...prev, deletingId: null }));
    }
  };

  // Quitar state.lastDoc de las dependencias para evitar bucle
  const fetchBonos = useCallback(
    async (isNewSearch = false) => {
      if (!firebaseUser || !profile) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "No hay usuario o perfil cargado",
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        loading: isNewSearch,
        error: null,
      }));

      try {
        let q;
        if (profile.role === "inversionista") {
          q = query(collection(db, "bonds"), limit(BONOS_POR_PAGINA));
        } else {
          q = query(
            collection(db, "bonds"),
            where("userId", "==", firebaseUser.uid),
            limit(BONOS_POR_PAGINA)
          );
        }
        // Usar una variable local para el paginado
        const lastDoc = isNewSearch ? null : state.lastDoc;
        if (lastDoc) {
          q = query(q, startAfter(lastDoc));
        }
        const snapshot = await getDocs(q);
        const bonosData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as (Bono & { id: string })[];

        const sortedBonos = bonosData.sort((a, b) => {
          const dateA = typeof a.creadoEn === "object" ? a.creadoEn.seconds : 0;
          const dateB = typeof b.creadoEn === "object" ? b.creadoEn.seconds : 0;
          return dateB - dateA;
        });

        setState((prev) => ({
          ...prev,
          bonos: isNewSearch ? sortedBonos : [...prev.bonos, ...sortedBonos],
          lastDoc: snapshot.docs[snapshot.docs.length - 1],
          hasMore: snapshot.docs.length === BONOS_POR_PAGINA,
          loading: false,
          error:
            sortedBonos.length === 0 && isNewSearch
              ? "No se encontraron bonos para este usuario."
              : null,
        }));
      } catch (error: unknown) {
        console.error("Error fetching bonos:", error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            error instanceof Error
              ? `Error al cargar los bonos: ${error.message}`
              : "Error al cargar los bonos",
        }));
        toast.error("Error al cargar los bonos");
      }
    },
    [firebaseUser, profile] // Quitar state.lastDoc de dependencias
  );

  useEffect(() => {
    if (!userLoading && firebaseUser && profile) {
      fetchBonos(true);
    }
  }, [fetchBonos, userLoading, firebaseUser, profile]);

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newSearchTerm = e.target.value;
      setState((prev) => ({
        ...prev,
        searchTerm: newSearchTerm,
        lastDoc: null,
        hasMore: true,
      }));
      fetchBonos(true);
    },
    [fetchBonos]
  );

  const filteredBonos = useMemo(
    () =>
      state.bonos.filter((bono) =>
        bono.nombre.toLowerCase().includes(state.searchTerm.toLowerCase())
      ),
    [state.bonos, state.searchTerm]
  );

  if (userLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="animate-spin h-6 w-6 text-blue-600 mr-2" />
        <span className="text-blue-700 font-medium">Cargando sesión...</span>
      </div>
    );
  }

  if (!firebaseUser || !profile) {
    return (
      <div className="flex flex-col items-center py-12 bg-white rounded-lg shadow-sm">
        <p className="text-center text-gray-500 mb-4">
          No tienes acceso a esta página. Por favor, inicia sesión.
        </p>
        <Button
          onClick={() => router.push("/login")}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          Ir a iniciar sesión
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {state.error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          <strong>Error:</strong> {state.error}
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar bonos..."
            value={state.searchTerm}
            onChange={handleSearch}
            className="pl-8"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => exportBonosToPDF(state.bonos)}
            disabled={state.bonos.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </Button>
          {profile.role === "emisor" && (
            <Button
              onClick={() => router.push("/bonos/register")}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4" /> Registrar nuevo bono
            </Button>
          )}
        </div>
      </div>

      {state.loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin h-6 w-6 text-blue-600 mr-2" />
          <span className="text-blue-700 font-medium">Cargando bonos...</span>
        </div>
      ) : filteredBonos.length === 0 ? (
        <div className="flex flex-col items-center py-12 bg-white rounded-lg shadow-sm">
          <p className="text-center text-gray-500 mb-4">
            {state.searchTerm
              ? "No se encontraron bonos que coincidan con la búsqueda."
              : "No hay bonos registrados."}
          </p>
          {!state.searchTerm && profile.role === "emisor" && (
            <Button
              onClick={() => router.push("/bonos/register")}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4" /> Registrar nuevo bono
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBonos.map((bono) => (
              <Card key={bono.id} className="p-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        {bono.nombre}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {bono.emisorNombre || "Emisor no especificado"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/bonos/detail/${bono.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {profile.role === "emisor" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              router.push(`/bonos/edit/${bono.id}`)
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => eliminarBono(bono.id)}
                            disabled={state.deletingId === bono.id}
                          >
                            {state.deletingId === bono.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Valor Nominal</p>
                      <p className="font-medium">
                        {formatCurrency(bono.valorNominal, bono.moneda)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tasa Anual</p>
                      <p className="font-medium">{bono.tasaAnual}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Plazo</p>
                      <p className="font-medium">{bono.plazo} años</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Fecha Emisión</p>
                      <p className="font-medium">
                        {formatDate(bono.fechaEmision)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          {state.hasMore && (
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                onClick={() => fetchBonos(false)}
                disabled={state.loading}
                className="flex items-center gap-2"
              >
                {state.loading ? (
                  <Loader2 className="animate-spin h-4 w-4" />
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
