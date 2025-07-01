"use client";

import { useEffect, useState, useMemo } from "react";
import { getDocs, collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { Card } from "@/components/ui/card";
import { ArrowUpDown, Loader2 } from "lucide-react";
import type { BonoData } from "@/lib/bonoUtils";
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

const campos = [
  { key: "nombre", label: "Nombre" },
  { key: "valorNominal", label: "Valor Nominal" },
  { key: "moneda", label: "Moneda" },
  { key: "tasaAnual", label: "Tasa Anual (%)" },
  { key: "plazo", label: "Plazo (años)" },
  { key: "tipoTasa", label: "Tipo de Tasa" },
  { key: "fechaEmision", label: "Fecha de Emisión" },
  { key: "comisionEmisor", label: "Comisión Emisor (%)" },
  { key: "comisionBonista", label: "Comisión Bonista (%)" },
  { key: "tasaMercado", label: "Tasa Rendimiento Exigida (%)" },
];

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

  // Filtros avanzados
  const [filtroMoneda, setFiltroMoneda] = useState("");
  const [filtroPlazo, setFiltroPlazo] = useState("");
  const [filtroTasa, setFiltroTasa] = useState("");
  const [filtroEmisor, setFiltroEmisor] = useState("");

  // Ordenamiento
  const [orden, setOrden] = useState("nombre");
  const [ordenDesc, setOrdenDesc] = useState(false);

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
      <Card className="p-6">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Seleccionar Bono para Análisis
            </h2>
            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2"
            >
              {showAdvancedFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
            </Button>
          </div>

          {showAdvancedFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
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
                  value={filtroTasa}
                  onChange={(e) => setFiltroTasa(e.target.value)}
                  placeholder="Filtrar por tasa"
                />
              </div>
              <div className="space-y-2">
                <Label>Emisor</Label>
                <Input
                  value={filtroEmisor}
                  onChange={(e) => setFiltroEmisor(e.target.value)}
                  placeholder="Buscar emisor"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label>Ordenar por:</Label>
              <Select value={orden} onValueChange={setOrden}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Seleccionar campo" />
                </SelectTrigger>
                <SelectContent>
                  {campos.map((campo) => (
                    <SelectItem key={campo.key} value={campo.key}>
                      {campo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOrdenDesc(!ordenDesc)}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBonos.map((bono) => (
            <Card
              key={bono.id}
              className={`p-6 transition-all duration-200 hover:shadow-lg ${
                selected.includes(bono.id) ? "ring-2 ring-blue-500" : ""
              }`}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {bono.nombre}
                    </h3>
                    <p className="text-sm text-gray-500">{bono.moneda}</p>
                  </div>
                  <Button
                    variant={selected.includes(bono.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSelect(bono.id)}
                  >
                    {selected.includes(bono.id)
                      ? "Seleccionado"
                      : "Seleccionar"}
                  </Button>
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
                    <p className="font-medium text-green-600">
                      {bono.tasaAnual}%
                    </p>
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
                  </div>{" "}
                </div>
              </div>
            </Card>
          ))}{" "}
        </div>
      )}
    </div>
  );
}
