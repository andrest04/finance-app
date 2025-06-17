"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
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
  orderBy,
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
  Filter,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  Calendar,
  DollarSign,
  Building,
  ChevronDown,
  RefreshCw,
  MoreHorizontal,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exportBonosToPDF } from "@/lib/exportUtils";
import { calcularTCEABono, calcularTREABono } from "@/lib/bonoUtils";
import type { BonoData } from "@/lib/bonoUtils";

type Bono = BonoData & { id: string };

interface FilterState {
  moneda: string;
  tipoTasa: string;
  minTasa: string;
  maxTasa: string;
  estado: string;
}

interface SortState {
  field: string;
  direction: "asc" | "desc";
}

interface BonoStats {
  total: number;
  valoresPorMoneda: Record<string, number>;
  proximoVencimiento: string;
}

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

function getBonoStatus(bono: Bono): {
  status: string;
  color: string;
  icon: React.ReactNode;
} {
  const now = new Date();
  const emissionDate = new Date(
    typeof bono.fechaEmision === "string" ? bono.fechaEmision : ""
  );
  const maturityDate = new Date(emissionDate);
  maturityDate.setFullYear(maturityDate.getFullYear() + bono.plazo);

  if (now < emissionDate) {
    return {
      status: "Por Emitir",
      color: "text-blue-600 bg-blue-100",
      icon: <Clock className="w-3 h-3" />,
    };
  } else if (now >= emissionDate && now < maturityDate) {
    return {
      status: "Activo",
      color: "text-green-600 bg-green-100",
      icon: <CheckCircle className="w-3 h-3" />,
    };
  } else {
    return {
      status: "Vencido",
      color: "text-red-600 bg-red-100",
      icon: <AlertCircle className="w-3 h-3" />,
    };
  }
}

const BONOS_POR_PAGINA = 12;

// Hook personalizado para memoizar cálculos financieros con cache
const useBonoCalculations = (bono: Bono) => {
  return useMemo(() => {
    // Cache key basado en los datos relevantes del bono
    const cacheKey = `${bono.id}-${bono.valorNominal}-${bono.tasaAnual}-${bono.plazo}`;

    return {
      status: getBonoStatus(bono),
      tcea: calcularTCEABono(bono),
      trea: calcularTREABono(bono),
      cacheKey,
    };
  }, [bono]);
};

// Componente memoizado para tarjetas de bono
const BonoCard = React.memo(
  ({
    bono,
    profile,
    router,
    eliminarBono,
    deletingId,
  }: {
    bono: Bono;
    profile: { role?: string };
    router: { push: (path: string) => void };
    eliminarBono: (id: string, name: string) => void;
    deletingId: string | null;
  }) => {
    const { status, tcea, trea } = useBonoCalculations(bono);

    return (
      <Card
        key={bono.id}
        className="overflow-hidden hover:shadow-lg transition-shadow duration-200"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">
                {bono.nombre}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {bono.emisorNombre || "Emisor no especificado"}
              </p>
              <div
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}
              >
                {status.icon}
                {status.status}
              </div>
            </div>
            <div className="flex gap-1 ml-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/bonos/detail/${bono.id}`)}
                className="h-8 w-8"
              >
                <Eye className="h-4 w-4" />
              </Button>
              {profile.role === "emisor" && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push(`/bonos/edit/${bono.id}`)}
                    className="h-8 w-8"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => eliminarBono(bono.id, bono.nombre)}
                    disabled={deletingId === bono.id}
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {deletingId === bono.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Valor Nominal</p>
              <p className="font-bold text-lg text-gray-900">
                {formatCurrency(bono.valorNominal, bono.moneda)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Tasa Anual</p>
              <p className="font-bold text-lg text-green-600">
                {bono.tasaAnual}%
              </p>
            </div>
          </div>
          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">TCEA</p>
              <p className="font-semibold text-blue-600">{tcea.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-gray-500">TREA</p>
              <p className="font-semibold text-purple-600">
                {trea.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-gray-500">Plazo</p>
              <p className="font-semibold">{bono.plazo} años</p>
            </div>
            <div>
              <p className="text-gray-500">Emisión</p>
              <p className="font-semibold">{formatDate(bono.fechaEmision)}</p>
            </div>
          </div>{" "}
        </div>
        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">
              {bono.tipoTasa} • {bono.moneda}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/bonos/detail/${bono.id}`)}
              className="text-blue-600 hover:text-blue-700 h-7 px-2"
            >
              Ver detalles →
            </Button>
          </div>
        </div>
      </Card>
    );
  }
);

BonoCard.displayName = "BonoCard";

// Componente memoizado para filas de tabla
const BonoTableRow = React.memo(
  ({
    bono,
    profile,
    router,
    eliminarBono,
    deletingId,
  }: {
    bono: Bono;
    profile: { role?: string };
    router: { push: (path: string) => void };
    eliminarBono: (id: string, name: string) => void;
    deletingId: string | null;
  }) => {
    const { status, tcea, trea } = useBonoCalculations(bono);

    return (
      <tr key={bono.id} className="border-b hover:bg-gray-50 transition-colors">
        <td className="p-4">
          <div>
            <p className="font-semibold text-gray-900">{bono.nombre}</p>
            <p className="text-sm text-gray-600">
              {bono.emisorNombre || "Emisor no especificado"}
            </p>
            <p className="text-xs text-gray-500">
              {formatDate(bono.fechaEmision)}
            </p>
          </div>
        </td>
        <td className="p-4">
          <div
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}
          >
            {status.icon}
            {status.status}
          </div>
        </td>
        <td className="p-4 text-right font-semibold">
          {formatCurrency(bono.valorNominal, bono.moneda)}
        </td>
        <td className="p-4 text-right font-semibold text-green-600">
          {bono.tasaAnual}%
        </td>
        <td className="p-4 text-right font-semibold text-blue-600">
          {tcea.toFixed(2)}%
        </td>
        <td className="p-4 text-right font-semibold text-purple-600">
          {trea.toFixed(2)}%
        </td>
        <td className="p-4 text-center">{bono.plazo} años</td>
        <td className="p-4">
          <div className="flex justify-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/bonos/detail/${bono.id}`)}
              className="h-8 w-8"
            >
              <Eye className="h-4 w-4" />
            </Button>
            {profile.role === "emisor" && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push(`/bonos/edit/${bono.id}`)}
                  className="h-8 w-8"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => eliminarBono(bono.id, bono.nombre)}
                  disabled={deletingId === bono.id}
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {deletingId === bono.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>{" "}
              </>
            )}
          </div>
        </td>
      </tr>
    );
  }
);

BonoTableRow.displayName = "BonoTableRow";

export default function BonoListEnhanced() {
  const { firebaseUser, profile, loading: userLoading } = useCurrentUser();
  const [state, setState] = useState<{
    bonos: Bono[];
    loading: boolean;
    deletingId: string | null;
    searchTerm: string;
    lastDoc: DocumentSnapshot | null;
    hasMore: boolean;
    error: string | null;
    refreshing: boolean;
    initialized: boolean;
  }>({
    bonos: [],
    loading: false,
    deletingId: null,
    searchTerm: "",
    lastDoc: null,
    hasMore: true,
    error: null,
    refreshing: false,
    initialized: false,
  });

  const [filters, setFilters] = useState<FilterState>({
    moneda: "all",
    tipoTasa: "all",
    minTasa: "",
    maxTasa: "",
    estado: "all",
  });

  const [sortConfig, setSortConfig] = useState<SortState>({
    field: "fechaEmision",
    direction: "desc",
  });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState("");

  const router = useRouter(); // Optimización: Lazy loading de estadísticas
  const stats = useMemo((): BonoStats => {
    if (state.bonos.length === 0) {
      return {
        total: 0,
        valoresPorMoneda: {},
        proximoVencimiento: "N/A",
      };
    }

    const total = state.bonos.length;

    // Calcular valores por moneda
    const valoresPorMoneda: Record<string, number> = {};
    state.bonos.forEach((bono) => {
      const moneda = bono.moneda;
      valoresPorMoneda[moneda] =
        (valoresPorMoneda[moneda] || 0) + bono.valorNominal;
    });

    // Find next maturity
    const now = new Date();
    const proximosVencimientos = state.bonos
      .map((bono) => {
        const emissionDate = new Date(
          typeof bono.fechaEmision === "string" ? bono.fechaEmision : ""
        );
        const maturityDate = new Date(emissionDate);
        maturityDate.setFullYear(maturityDate.getFullYear() + bono.plazo);
        return { nombre: bono.nombre, fecha: maturityDate };
      })
      .filter((item) => item.fecha > now)
      .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

    const proximoVencimiento =
      proximosVencimientos.length > 0
        ? proximosVencimientos[0].fecha.toLocaleDateString("es-PE")
        : "N/A";

    return {
      total,
      valoresPorMoneda,
      proximoVencimiento,
    };
  }, [state.bonos]);

  const eliminarBono = async (bonoId: string, bonoNombre: string) => {
    if (!firebaseUser) return;

    const confirmacion = window.confirm(
      `¿Seguro que deseas eliminar el bono "${bonoNombre}"? Esta acción no se puede deshacer.`
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
      toast.success(`Bono "${bonoNombre}" eliminado correctamente`);
    } catch (error) {
      console.error("Error al eliminar bono:", error);
      toast.error("Error al eliminar el bono");
      setState((prev) => ({ ...prev, deletingId: null }));
    }
  };
  const fetchBonos = useCallback(
    async (isNewSearch = false, isRefresh = false) => {
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
        refreshing: isRefresh,
        error: null,
      }));

      try {
        let q;
        if (profile.role === "inversionista") {
          q = query(
            collection(db, "bonds"),
            orderBy(
              sortConfig.field === "fechaEmision"
                ? "creadoEn"
                : sortConfig.field,
              sortConfig.direction
            ),
            limit(BONOS_POR_PAGINA)
          );
        } else {
          q = query(
            collection(db, "bonds"),
            where("userId", "==", firebaseUser.uid),
            orderBy(
              sortConfig.field === "fechaEmision"
                ? "creadoEn"
                : sortConfig.field,
              sortConfig.direction
            ),
            limit(BONOS_POR_PAGINA)
          );
        } // Usar setState con callback para acceder al estado actual
        setState((currentState) => {
          const lastDoc =
            isNewSearch || isRefresh ? null : currentState.lastDoc;

          // Reconstruir query si hay lastDoc
          let finalQuery = q;
          if (lastDoc) {
            finalQuery = query(q, startAfter(lastDoc));
          }

          // Ejecutar query de forma asíncrona
          getDocs(finalQuery)
            .then((snapshot) => {
              const bonosData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              })) as Bono[];

              setState((prev) => ({
                ...prev,
                bonos:
                  isNewSearch || isRefresh
                    ? bonosData
                    : [...prev.bonos, ...bonosData],
                lastDoc: snapshot.docs[snapshot.docs.length - 1],
                hasMore: snapshot.docs.length === BONOS_POR_PAGINA,
                loading: false,
                refreshing: false,
                initialized: true,
                error:
                  bonosData.length === 0 && (isNewSearch || isRefresh)
                    ? "No se encontraron bonos."
                    : null,
              }));
            })
            .catch((error: unknown) => {
              console.error("Error fetching bonos:", error);
              setState((prev) => ({
                ...prev,
                loading: false,
                refreshing: false,
                initialized: true,
                error:
                  error instanceof Error
                    ? `Error al cargar los bonos: ${error.message}`
                    : "Error al cargar los bonos",
              }));
              toast.error("Error al cargar los bonos");
            });

          return currentState; // No cambiar el estado en este setState
        });
      } catch (error: unknown) {
        console.error("Error fetching bonos:", error);
        setState((prev) => ({
          ...prev,
          loading: false,
          refreshing: false,
          initialized: true,
          error:
            error instanceof Error
              ? `Error al cargar los bonos: ${error.message}`
              : "Error al cargar los bonos",
        }));
        toast.error("Error al cargar los bonos");
      }
    },
    [firebaseUser, profile, sortConfig]
  );
  useEffect(() => {
    if (!userLoading && firebaseUser && profile && !state.initialized) {
      fetchBonos(true);
    }
  }, [fetchBonos, userLoading, firebaseUser, profile, state.initialized]);

  // Sincronizar estado local con estado del componente
  useEffect(() => {
    setLocalSearchTerm(state.searchTerm);
  }, [state.searchTerm]);
  // Debounced search - solo ejecutar para búsquedas después de la inicialización
  useEffect(() => {
    if (!state.initialized) return;

    // Solo ejecutar búsqueda si hay término de búsqueda
    if (state.searchTerm.length > 0) {
      const timer = setTimeout(() => {
        fetchBonos(true);
      }, 300);

      return () => clearTimeout(timer);
    }
    // Si searchTerm está vacío, no hacer nada adicional
    // ya que los datos originales ya están cargados
  }, [state.searchTerm, fetchBonos, state.initialized]);
  // Optimizar handleSearch para reducir re-renders
  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newSearchTerm = e.target.value;
      setLocalSearchTerm(newSearchTerm); // Actualización inmediata de UI

      // Si se limpia la búsqueda, recargar datos originales inmediatamente
      if (newSearchTerm === "" && state.searchTerm !== "") {
        setState((prev) => ({
          ...prev,
          searchTerm: "",
          lastDoc: null,
          hasMore: true,
        }));
        // Recargar datos originales cuando se limpia la búsqueda
        fetchBonos(true);
      } else {
        // Debounce para actualizar el estado real
        setState((prev) => ({
          ...prev,
          searchTerm: newSearchTerm,
          lastDoc: null,
          hasMore: true,
        }));
      }
    },
    [state.searchTerm, fetchBonos]
  );
  const handleSort = useCallback(
    (field: string) => {
      const newDirection =
        sortConfig.field === field && sortConfig.direction === "asc"
          ? "desc"
          : "asc";
      setSortConfig({ field, direction: newDirection });
      setState((prev) => ({ ...prev, lastDoc: null, hasMore: true }));
      // Recargar datos con el nuevo ordenamiento
      fetchBonos(true);
    },
    [sortConfig.field, sortConfig.direction, fetchBonos]
  );

  const handleRefresh = useCallback(() => {
    fetchBonos(true, true);
  }, [fetchBonos]);
  const filteredAndSortedBonos = useMemo(() => {
    // Si no hay bonos, retornar array vacío inmediatamente
    if (!state.bonos.length) return [];

    const filtered = state.bonos.filter((bono) => {
      // Search filter - optimizado para evitar llamadas innecesarias
      if (state.searchTerm) {
        const searchTerm = state.searchTerm.toLowerCase();
        const matchesSearch =
          bono.nombre.toLowerCase().includes(searchTerm) ||
          (bono.emisorNombre?.toLowerCase().includes(searchTerm) ?? false);
        if (!matchesSearch) return false;
      }

      // Currency filter
      if (filters.moneda !== "all" && bono.moneda !== filters.moneda) {
        return false;
      }

      // Type filter
      if (filters.tipoTasa !== "all" && bono.tipoTasa !== filters.tipoTasa) {
        return false;
      }

      // Rate range filter
      if (filters.minTasa && bono.tasaAnual < parseFloat(filters.minTasa)) {
        return false;
      }
      if (filters.maxTasa && bono.tasaAnual > parseFloat(filters.maxTasa)) {
        return false;
      }

      // Status filter - solo calcular si es necesario
      if (filters.estado !== "all") {
        const bonoStatus = getBonoStatus(bono);
        if (
          !bonoStatus.status
            .toLowerCase()
            .includes(filters.estado.toLowerCase())
        ) {
          return false;
        }
      }

      return true;
    }); // Client-side sorting optimizado
    if (filtered.length > 1) {
      filtered.sort((a, b) => {
        const field = sortConfig.field as keyof Bono;
        const aValue = a[field];
        const bValue = b[field];

        // Handle dates más eficientemente
        if (sortConfig.field === "fechaEmision") {
          const aTime =
            typeof aValue === "string" ? new Date(aValue).getTime() : 0;
          const bTime =
            typeof bValue === "string" ? new Date(bValue).getTime() : 0;
          return sortConfig.direction === "asc" ? aTime - bTime : bTime - aTime;
        }

        // Handle numbers
        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortConfig.direction === "asc"
            ? aValue - bValue
            : bValue - aValue;
        }

        // Handle strings
        if (typeof aValue === "string" && typeof bValue === "string") {
          const comparison = aValue
            .toLowerCase()
            .localeCompare(bValue.toLowerCase());
          return sortConfig.direction === "asc" ? comparison : -comparison;
        }

        return 0;
      });
    }

    return filtered;
  }, [state.bonos, state.searchTerm, filters, sortConfig]);

  if (userLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600 mr-3" />
        <span className="text-blue-700 font-medium text-lg">
          Cargando sesión...
        </span>
      </div>
    );
  }

  if (!firebaseUser || !profile) {
    return (
      <div className="flex flex-col items-center py-16 bg-white rounded-xl shadow-sm border">
        <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
        <p className="text-center text-gray-500 mb-6 text-lg">
          No tienes acceso a esta página. Por favor, inicia sesión.
        </p>
        <Button
          onClick={() => router.push("/login")}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-3"
        >
          Ir a iniciar sesión
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {profile?.role === "emisor"
                ? "Mis Bonos Registrados"
                : "Bonos Disponibles"}
            </h1>
            <p className="text-gray-600">
              {profile?.role === "emisor"
                ? "Gestiona y supervisa tus bonos emitidos"
                : "Explora oportunidades de inversión disponibles"}
            </p>
          </div>
          <div className="flex gap-3 mt-4 lg:mt-0">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={state.refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${state.refreshing ? "animate-spin" : ""}`}
              />
              Actualizar
            </Button>
            {profile.role === "emisor" && (
              <Button
                onClick={() => router.push("/bonos/register")}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4" /> Nuevo Bono
              </Button>
            )}
          </div>{" "}
        </div>
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-4 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Bonos</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.total}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-4 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Valores por Moneda</p>
                <div className="space-y-1">
                  {Object.keys(stats.valoresPorMoneda).length === 0 ? (
                    <p className="text-lg font-bold text-gray-500">Sin bonos</p>
                  ) : (
                    Object.entries(stats.valoresPorMoneda).map(
                      ([moneda, valor]) => (
                        <p
                          key={moneda}
                          className="text-sm font-bold text-green-600"
                        >
                          {formatCurrency(valor, moneda)}
                        </p>
                      )
                    )
                  )}
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-4 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  Próximo Vencimiento
                </p>
                <p className="text-lg font-bold text-orange-600">
                  {stats.proximoVencimiento}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-orange-600" />
            </div>
          </Card>
        </div>
      </div>
      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          {" "}
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar por nombre o emisor..."
            value={localSearchTerm}
            onChange={handleSearch}
            className="pl-10 h-12"
          />
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 h-12"
          >
            <Filter className="w-4 h-4" />
            Filtros
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                showFilters ? "rotate-180" : ""
              }`}
            />
          </Button>
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={() => exportBonosToPDF(filteredAndSortedBonos)}
            disabled={filteredAndSortedBonos.length === 0}
            className="flex items-center gap-2 h-12"
          >
            <Download className="w-4 h-4" />
            PDF{" "}
          </Button>
        </div>
      </div>
      {/* Indicador sutil de loading durante búsqueda/filtrado */}
      {(state.loading || state.refreshing) && state.initialized && (
        <div className="flex justify-center py-2">
          <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            <Loader2 className="animate-spin h-3 w-3" />
            <span>Actualizando...</span>
          </div>
        </div>
      )}
      {/* Filters Panel */}
      {showFilters && (
        <Card className="p-6 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Moneda
              </label>
              <Select
                value={filters.moneda}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, moneda: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="PEN">Soles (PEN)</SelectItem>
                  <SelectItem value="USD">Dólares (USD)</SelectItem>
                  <SelectItem value="EUR">Euros (EUR)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Tipo de Tasa
              </label>
              <Select
                value={filters.tipoTasa}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, tipoTasa: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="Efectiva">Efectiva</SelectItem>
                  <SelectItem value="Nominal">Nominal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Tasa Mínima (%)
              </label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minTasa}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, minTasa: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Tasa Máxima (%)
              </label>
              <Input
                type="number"
                placeholder="100"
                value={filters.maxTasa}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, maxTasa: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Estado
              </label>
              <Select
                value={filters.estado}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, estado: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="activo">Activos</SelectItem>
                  <SelectItem value="por emitir">Por Emitir</SelectItem>
                  <SelectItem value="vencido">Vencidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              onClick={() =>
                setFilters({
                  moneda: "all",
                  tipoTasa: "all",
                  minTasa: "",
                  maxTasa: "",
                  estado: "all",
                })
              }
            >
              Limpiar Filtros
            </Button>
          </div>
        </Card>
      )}
      {/* Error State */}
      {state.error && (
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="font-medium text-red-800">Error</h3>
              <p className="text-red-600">{state.error}</p>
            </div>
          </div>
        </Card>
      )}{" "}
      {/* Loading State - Solo mostrar loading completo en carga inicial */}
      {state.loading && !state.initialized ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600 mr-3" />
          <span className="text-blue-700 font-medium text-lg">
            Cargando bonos...
          </span>
        </div>
      ) : filteredAndSortedBonos.length === 0 && state.initialized ? (
        /* Empty State */
        <Card className="p-12 text-center">
          <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {state.searchTerm ||
            Object.values(filters).some((f) => f !== "all" && f !== "")
              ? "No se encontraron bonos"
              : "No hay bonos registrados"}
          </h3>
          <p className="text-gray-500 mb-6">
            {state.searchTerm ||
            Object.values(filters).some((f) => f !== "all" && f !== "")
              ? "Intenta ajustar los filtros o términos de búsqueda."
              : profile.role === "emisor"
              ? "Comienza registrando tu primer bono corporativo."
              : "Aún no hay bonos disponibles para inversión."}
          </p>
          {!state.searchTerm &&
            !Object.values(filters).some((f) => f !== "all" && f !== "") &&
            profile.role === "emisor" && (
              <Button
                onClick={() => router.push("/bonos/register")}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4" /> Registrar Primer Bono
              </Button>
            )}
        </Card>
      ) : (
        /* Bonds List */
        <>
          {/* Sort Controls */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {" "}
              Mostrando {filteredAndSortedBonos.length} de {state.bonos.length}
              bonos
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Ordenar por:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort("nombre")}
                className="flex items-center gap-1"
              >
                Nombre
                {sortConfig.field === "nombre" &&
                  (sortConfig.direction === "asc" ? (
                    <SortAsc className="w-3 h-3" />
                  ) : (
                    <SortDesc className="w-3 h-3" />
                  ))}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort("tasaAnual")}
                className="flex items-center gap-1"
              >
                Tasa
                {sortConfig.field === "tasaAnual" &&
                  (sortConfig.direction === "asc" ? (
                    <SortAsc className="w-3 h-3" />
                  ) : (
                    <SortDesc className="w-3 h-3" />
                  ))}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort("fechaEmision")}
                className="flex items-center gap-1"
              >
                Fecha
                {sortConfig.field === "fechaEmision" &&
                  (sortConfig.direction === "asc" ? (
                    <SortAsc className="w-3 h-3" />
                  ) : (
                    <SortDesc className="w-3 h-3" />
                  ))}
              </Button>
            </div>{" "}
          </div>
          {/* Bonds Grid/List */}
          {state.loading && state.initialized ? (
            /* Skeleton loading durante búsqueda/filtrado */
            <div className="space-y-4">
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="p-6 animate-pulse">
                      <div className="space-y-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="h-3 bg-gray-200 rounded"></div>
                          <div className="h-3 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="overflow-hidden">
                  <div className="animate-pulse">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="border-b p-4">
                        <div className="flex items-center space-x-4">
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedBonos.map((bono) => (
                <BonoCard
                  key={bono.id}
                  bono={bono}
                  profile={profile}
                  router={router}
                  eliminarBono={eliminarBono}
                  deletingId={state.deletingId}
                />
              ))}
            </div>
          ) : (
            /* List View */
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-4 font-semibold text-gray-700">
                        Bono
                      </th>
                      <th className="text-left p-4 font-semibold text-gray-700">
                        Estado
                      </th>
                      <th className="text-right p-4 font-semibold text-gray-700">
                        Valor Nominal
                      </th>
                      <th className="text-right p-4 font-semibold text-gray-700">
                        Tasa
                      </th>
                      <th className="text-right p-4 font-semibold text-gray-700">
                        TCEA
                      </th>
                      <th className="text-right p-4 font-semibold text-gray-700">
                        TREA
                      </th>
                      <th className="text-center p-4 font-semibold text-gray-700">
                        Plazo
                      </th>{" "}
                      <th className="text-center p-4 font-semibold text-gray-700">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedBonos.map((bono) => (
                      <BonoTableRow
                        key={bono.id}
                        bono={bono}
                        profile={profile}
                        router={router}
                        eliminarBono={eliminarBono}
                        deletingId={state.deletingId}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
          {/* Load More */}
          {state.hasMore && (
            <div className="flex justify-center pt-8">
              <Button
                variant="outline"
                onClick={() => fetchBonos(false)}
                disabled={state.loading}
                className="flex items-center gap-2 px-6 py-3"
              >
                {state.loading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <MoreHorizontal className="h-4 w-4" />
                    Cargar más bonos
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
