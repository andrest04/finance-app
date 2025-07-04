"use client";

import { useEffect, useState, useMemo } from "react";
import { getDocs, collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { useCurrentUser } from "@/lib/firebase/useCurrentUser";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import type { BonoData } from "@/lib/bono/bonoUtils";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

function formatDate(date: string | { seconds: number }) {
  if (typeof date === "string") {
    return new Date(date).toLocaleDateString("es-PE");
  }
  return new Date(date.seconds * 1000).toLocaleDateString("es-PE");
}

function formatCurrency(value: number, currency: string) {
  return `${currency} ${value.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
  })}`;
}

interface SelectorBonosProps {
  onBonoSeleccionado: (bonos: (BonoData & { id: string })[]) => void;
}

export default function SelectorBonos({
  onBonoSeleccionado,
}: SelectorBonosProps) {
  const { firebaseUser, profile, loading: userLoading } = useCurrentUser();
  const [bonos, setBonos] = useState<(BonoData & { id: string })[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Filtros avanzados
  const [filtroMoneda, setFiltroMoneda] = useState("");
  const [filtroPlazo, setFiltroPlazo] = useState("");
  const [filtroTasa, setFiltroTasa] = useState("");
  const [filtroEmisor, setFiltroEmisor] = useState("");

  // Ordenamiento
  const [orden] = useState("nombre");
  const [ordenDesc] = useState(false);

  useEffect(() => {
    const fetchBonos = async () => {
      setLoading(true);
      let q;
      if (profile?.role === "emisor") {
        q = query(
          collection(db, "bonds"),
          where("userId", "==", firebaseUser?.uid)
        );
      } else {
        q = query(collection(db, "bonds"));
      }
      const snapshot = await getDocs(q);
      setBonos(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as (BonoData & { id: string })[]
      );
      setLoading(false);
    };
    if (!userLoading && profile) fetchBonos();
  }, [firebaseUser, profile, userLoading]);

  // Notify parent component when selected bond changes
  useEffect(() => {
    const selectedBonos = bonos.filter((b) => selected.includes(b.id));
    onBonoSeleccionado(selectedBonos);
  }, [selected, bonos, onBonoSeleccionado]);
  const handleSelect = (id: string) => {
    setSelected((prev) => {
      // Solo permitir un bono seleccionado a la vez
      const isCurrentlySelected = prev.includes(id);
      return isCurrentlySelected ? [] : [id];
    });
  };

  const handleExpand = (id: string) => {
    setExpanded((prev) => (prev === id ? null : id));
  };

  const filteredBonos = useMemo(() => {
    return bonos
      .filter((bono) => {
        if (
          filtroMoneda &&
          filtroMoneda !== "all" &&
          bono.moneda !== filtroMoneda
        )
          return false;
        if (
          filtroPlazo &&
          filtroPlazo !== "all" &&
          bono.plazo !== Number(filtroPlazo)
        )
          return false;
        if (filtroTasa && bono.tasaAnual !== Number(filtroTasa)) return false;
        if (
          filtroEmisor &&
          !bono.nombre.toLowerCase().includes(filtroEmisor.toLowerCase())
        )
          return false;
        return true;
      })
      .sort((a, b) => {
        const aValue = a[orden as keyof BonoData];
        const bValue = b[orden as keyof BonoData];
        if (typeof aValue === "string" && typeof bValue === "string") {
          return ordenDesc
            ? bValue.localeCompare(aValue)
            : aValue.localeCompare(bValue);
        }
        return ordenDesc
          ? Number(bValue) - Number(aValue)
          : Number(aValue) - Number(bValue);
      });
  }, [
    bonos,
    filtroMoneda,
    filtroPlazo,
    filtroTasa,
    filtroEmisor,
    orden,
    ordenDesc,
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="animate-spin h-6 w-6 text-blue-600 mr-3" />
            <span className="text-blue-700 font-medium text-lg">
              Cargando bonos...
            </span>
          </div>
        ) : filteredBonos.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No hay bonos disponibles.
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {filteredBonos.map((bono) => (
              <li key={bono.id}>
                <div className="relative w-full">
                  <div
                    className={`w-full rounded-xl border transition-all shadow-sm px-6 py-4 bg-white hover:bg-blue-50 flex items-center gap-4 relative cursor-pointer select-none ${selected.includes(bono.id) ? "border-blue-600 ring-2 ring-blue-200 bg-blue-50" : "border-gray-200"}`}
                    onClick={() => handleSelect(bono.id)}
                  >
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className="font-bold text-lg text-gray-900 break-words whitespace-normal">
                        {bono.nombre}
                      </span>
                    </div>
                    <button
                      type="button"
                      aria-label={expanded === bono.id ? "Colapsar detalles" : "Expandir detalles"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExpand(bono.id);
                      }}
                      className="ml-2 p-1 rounded hover:bg-blue-100 focus:outline-none"
                    >
                      {expanded === bono.id ? (
                        <ChevronUp className="w-5 h-5 text-blue-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-blue-600" />
                      )}
                    </button>
                  </div>
                  {expanded === bono.id && (
                    <div className="mt-2 ml-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-100 text-sm text-gray-700 animate-fade-in">
                      <div className="flex flex-wrap gap-x-6 gap-y-1 mb-1">
                        <span>
                          <span className="font-medium">Moneda:</span> {bono.moneda}
                        </span>
                        <span>
                          <span className="font-medium">Valor Nominal:</span> {formatCurrency(bono.valorNominal, bono.moneda)}
                        </span>
                        <span>
                          <span className="font-medium">Tasa:</span> <span className="text-green-600 font-semibold">{bono.tasaAnual}%</span>
                        </span>
                        <span>
                          <span className="font-medium">Plazo:</span> {bono.plazo} años
                        </span>
                        <span>
                          <span className="font-medium">Emisión:</span> {formatDate(bono.fechaEmision)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Filtros avanzados opcionales */}
      {showAdvancedFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg mt-4">
          <div className="space-y-2">
            <Label>Moneda</Label>
            <Select value={filtroMoneda} onValueChange={setFiltroMoneda}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las monedas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="PEN">Soles (PEN)</SelectItem>
                <SelectItem value="USD">Dólares (USD)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Plazo (años)</Label>
            <Select value={filtroPlazo} onValueChange={setFiltroPlazo}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los plazos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="1">1 año</SelectItem>
                <SelectItem value="2">2 años</SelectItem>
                <SelectItem value="3">3 años</SelectItem>
                <SelectItem value="5">5 años</SelectItem>
                <SelectItem value="10">10 años</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tasa Anual (%)</Label>
            <Input
              type="number"
              placeholder="Ej: 5"
              value={filtroTasa}
              onChange={(e) => setFiltroTasa(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input
              type="text"
              placeholder="Buscar bono..."
              value={filtroEmisor}
              onChange={(e) => setFiltroEmisor(e.target.value)}
            />
          </div>
        </div>
      )}
      <div className="flex justify-end mt-2">
        <Button
          variant="outline"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="flex items-center gap-2"
        >
          {showAdvancedFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
        </Button>
      </div>
    </div>
  );
}
