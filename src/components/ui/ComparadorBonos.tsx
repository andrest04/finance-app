"use client";

import { useEffect, useState } from "react";
import { getDocs, collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import {
  calcularFlujoFrances,
  BonoParams,
  FlujoPeriodo,
} from "@/lib/francesMetod";
import { Info } from "lucide-react";
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { Download } from "lucide-react";
import { exportBonosToPDF } from "@/lib/exportUtils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  { key: "tasaMercado", label: "TREA (%)" },
];

function formatDate(date: string | { seconds: number }) {
  if (typeof date === "string") {
    return new Date(date).toLocaleDateString("es-PE");
  }
  return new Date(date.seconds * 1000).toLocaleDateString("es-PE");
}

// Función para calcular VAN
function calcularVAN(flujo: FlujoPeriodo[], tasa: number): number {
  return flujo.reduce(
    (acc, f, i) => acc + f.cuota / Math.pow(1 + tasa, i + 1),
    0
  );
}

// Función para calcular TIR (método de búsqueda incremental simple)
function calcularTIR(flujo: FlujoPeriodo[]): number {
  let tir = 0.01;
  const step = 0.0001;
  const maxIter = 10000;
  let lastVAN = calcularVAN(flujo, tir);
  for (let i = 0; i < maxIter; i++) {
    const van = calcularVAN(flujo, tir);
    if (Math.abs(van) < 0.01) return tir;
    if (van > 0) tir += step;
    else tir -= step;
    if (Math.abs(van - lastVAN) < 1e-8) break;
    lastVAN = van;
  }
  return tir;
}

export default function ComparadorBonos() {
  const { firebaseUser, profile, loading: userLoading } = useCurrentUser();
  const [bonos, setBonos] = useState<(BonoData & { id: string })[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasaDescuento, setTasaDescuento] = useState(0.1); // 10% por defecto

  // Filtros avanzados
  const [filtroMoneda, setFiltroMoneda] = useState("");
  const [filtroPlazo, setFiltroPlazo] = useState("");
  const [filtroTasa, setFiltroTasa] = useState("");
  const [filtroEmisor, setFiltroEmisor] = useState("");

  // Ordenamiento avanzado
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

  const handleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const bonosSeleccionados = bonos.filter((b) => selected.includes(b.id));

  // Obtener valores únicos para los selects
  const monedas = Array.from(new Set(bonos.map((b) => b.moneda))).filter(
    (m) => !!m && m !== ""
  );
  const emisores = Array.from(
    new Set(bonos.map((b) => b.emisorNombre || "")).values()
  ).filter((e) => !!e && e !== "");

  // Filtrado avanzado
  const bonosFiltrados = bonos.filter((b) => {
    return (
      (!filtroMoneda ||
        filtroMoneda === "__all__" ||
        b.moneda === filtroMoneda) &&
      (!filtroPlazo || b.plazo === Number(filtroPlazo)) &&
      (!filtroTasa || b.tasaAnual >= Number(filtroTasa)) &&
      (!filtroEmisor ||
        filtroEmisor === "__all__" ||
        (b.emisorNombre || "") === filtroEmisor)
    );
  });

  // Calcular VAN y TIR para cada bono seleccionado
  const rentabilidad: Record<
    string,
    { van: number; tir: number; flujo: FlujoPeriodo[] }
  > = {};
  bonosSeleccionados.forEach((bono) => {
    const params: BonoParams = {
      valorNominal: bono.valorNominal,
      tasaAnual: bono.tasaAnual,
      frecuenciaPago: bono.frecuenciaPago,
      plazo: bono.plazo,
      gracia: (bono.tipoGracia as "Ninguno" | "Total" | "Parcial") || "Ninguno",
      numPeriodosGracia: bono.nGracia || 0,
    };
    const flujo = calcularFlujoFrances(params);
    // El flujo de caja para el inversionista es negativo al inicio (compra) y luego los cobros
    const flujoInversionista = [
      {
        periodo: 0,
        cuota: -bono.valorNominal,
        interes: 0,
        amortizacion: 0,
        saldo: bono.valorNominal,
      },
      ...flujo,
    ];
    const van = calcularVAN(flujoInversionista, tasaDescuento);
    const tir = calcularTIR(flujoInversionista) * 100;
    rentabilidad[bono.id] = { van, tir, flujo: flujoInversionista };
  });

  // Simulador de inversión
  const [montoInversion, setMontoInversion] = useState(10000);

  // Calcula el flujo de caja simulado para cada bono seleccionado
  const simulaciones = bonosSeleccionados.map((bono) => {
    const ratio = montoInversion / bono.valorNominal;
    const flujo = rentabilidad[bono.id]?.flujo || [];
    const flujoSimulado = flujo.map((f) => ({
      ...f,
      cuota: f.cuota * ratio,
      interes: f.interes * ratio,
      amortizacion: f.amortizacion * ratio,
      saldo: f.saldo * ratio,
    }));
    const totalGanancia =
      flujoSimulado.reduce((acc, f) => acc + (f.cuota > 0 ? f.cuota : 0), 0) +
      (flujoSimulado[0]?.cuota || 0); // incluye el desembolso inicial negativo
    return {
      bono,
      flujoSimulado,
      totalGanancia,
    };
  });

  // Función de ordenamiento
  function ordenarBonos(arr: (BonoData & { id: string })[]) {
    const arrCopia = [...arr];
    arrCopia.sort((a, b) => {
      if (orden === "nombre") {
        return ordenDesc
          ? b.nombre.localeCompare(a.nombre)
          : a.nombre.localeCompare(b.nombre);
      }
      if (orden === "valorNominal") {
        return ordenDesc
          ? b.valorNominal - a.valorNominal
          : a.valorNominal - b.valorNominal;
      }
      if (orden === "plazo") {
        return ordenDesc ? b.plazo - a.plazo : a.plazo - b.plazo;
      }
      if (orden === "tasaAnual") {
        return ordenDesc
          ? b.tasaAnual - a.tasaAnual
          : a.tasaAnual - b.tasaAnual;
      }
      if (orden === "van") {
        // Solo tiene sentido si hay bonos seleccionados
        const vanA = rentabilidad[a.id]?.van ?? 0;
        const vanB = rentabilidad[b.id]?.van ?? 0;
        return ordenDesc ? vanB - vanA : vanA - vanB;
      }
      if (orden === "tir") {
        const tirA = rentabilidad[a.id]?.tir ?? 0;
        const tirB = rentabilidad[b.id]?.tir ?? 0;
        return ordenDesc ? tirB - tirA : tirA - tirB;
      }
      return 0;
    });
    return arrCopia;
  }

  const bonosFiltradosOrdenados = ordenarBonos(bonosFiltrados);

  // Exportar simulación a PDF
  function exportarSimulacionPDF() {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Simulación de Inversión en Bonos", 14, 18);
    doc.setFontSize(10);
    doc.text(
      `Monto invertido: ${montoInversion.toLocaleString("es-PE", {
        minimumFractionDigits: 2,
      })}`,
      14,
      26
    );
    let y = 34;
    simulaciones.forEach(({ bono, flujoSimulado, totalGanancia }, idx) => {
      doc.setFontSize(13);
      doc.text(`${idx + 1}. ${bono.nombre} (${bono.moneda})`, 14, y);
      doc.setFontSize(10);
      doc.text(
        `Ganancia total estimada: ${bono.moneda} ${totalGanancia.toLocaleString(
          "es-PE",
          { minimumFractionDigits: 2 }
        )}`,
        14,
        y + 6
      );
      // Use the returned object from autoTable correctly
      let finalY;
      autoTable(doc, {
        startY: y + 10,
        head: [["Periodo", "Cuota", "Interés", "Amortización", "Saldo"]],
        body: flujoSimulado.map((f) => [
          f.periodo,
          `${bono.moneda} ${f.cuota.toLocaleString("es-PE", {
            minimumFractionDigits: 2,
          })}`,
          `${bono.moneda} ${f.interes.toLocaleString("es-PE", {
            minimumFractionDigits: 2,
          })}`,
          `${bono.moneda} ${f.amortizacion.toLocaleString("es-PE", {
            minimumFractionDigits: 2,
          })}`,
          `${bono.moneda} ${f.saldo.toLocaleString("es-PE", {
            minimumFractionDigits: 2,
          })}`,
        ]),
        theme: "grid",
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontSize: 9,
        },
        styles: { fontSize: 8, cellPadding: 2 },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          if (data.cursor) {
            finalY = data.cursor.y;
          }
        },
      });
      y = (finalY || y + 50) + 10;
    });
    doc.save("simulacion_bonos.pdf");
  }

  return (
    <Card className="p-6 max-w-6xl mx-auto mt-6">
      <h2 className="text-xl font-bold mb-4 text-blue-800">
        Comparador de Bonos
      </h2>
      {/* Filtros avanzados y exportar */}
      <div className="mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Moneda
          </label>
          <Select
            value={filtroMoneda || "__all__"}
            onValueChange={(v) => setFiltroMoneda(v === "__all__" ? "" : v)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas</SelectItem>
              {monedas.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Plazo (años)
          </label>
          <Input
            type="number"
            min={0}
            value={filtroPlazo}
            onChange={(e) => setFiltroPlazo(e.target.value)}
            placeholder="Todos"
            className="w-24"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Tasa mínima (%)
          </label>
          <Input
            type="number"
            min={0}
            value={filtroTasa}
            onChange={(e) => setFiltroTasa(e.target.value)}
            placeholder="Todas"
            className="w-24"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Emisor
          </label>
          <Select
            value={filtroEmisor || "__all__"}
            onValueChange={(v) => setFiltroEmisor(v === "__all__" ? "" : v)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos</SelectItem>
              {emisores.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Ordenar por
          </label>
          <Select value={orden} onValueChange={setOrden}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nombre">Nombre</SelectItem>
              <SelectItem value="valorNominal">Monto</SelectItem>
              <SelectItem value="plazo">Plazo</SelectItem>
              <SelectItem value="tasaAnual">Tasa Anual</SelectItem>
              <SelectItem value="van">VAN</SelectItem>
              <SelectItem value="tir">TIR</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant={ordenDesc ? "secondary" : "outline"}
          className="h-9"
          onClick={() => setOrdenDesc((v) => !v)}
          title={ordenDesc ? "Orden descendente" : "Orden ascendente"}
        >
          {ordenDesc ? "↓" : "↑"}
        </Button>
        <Button
          variant="outline"
          className="ml-auto flex items-center gap-2"
          onClick={() => exportBonosToPDF(bonosFiltrados)}
          disabled={bonosFiltrados.length === 0}
        >
          <Download className="w-4 h-4" /> Exportar PDF
        </Button>
      </div>
      {/* Input de tasa de descuento para VAN */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center gap-4">
        <label className="flex items-center gap-2">
          <span className="text-sm text-gray-700">
            Tasa de descuento para VAN:
          </span>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={tasaDescuento}
            onChange={(e) => setTasaDescuento(Number(e.target.value))}
            className="border rounded px-2 py-1 w-24 text-right"
          />
          <span className="text-sm text-gray-500">(ej: 0.1 = 10%)</span>
        </label>
      </div>
      {/* Explicación de VAN y TIR */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <TooltipProvider>
          <div className="flex items-center gap-2 bg-blue-50 rounded px-3 py-2">
            <Info className="h-4 w-4 text-blue-700" />
            <span className="text-sm text-blue-900 font-medium">
              ¿Qué es el VAN?
            </span>
            <UiTooltip>
              <TooltipTrigger asChild>
                <span className="underline cursor-help text-blue-700">
                  (info)
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                El <b>Valor Actual Neto (VAN)</b> es la suma de los flujos
                futuros descontados a una tasa determinada. Si el VAN es
                positivo, el bono es rentable para esa tasa de descuento.
              </TooltipContent>
            </UiTooltip>
          </div>
          <div className="flex items-center gap-2 bg-purple-50 rounded px-3 py-2">
            <Info className="h-4 w-4 text-purple-700" />
            <span className="text-sm text-purple-900 font-medium">
              ¿Qué es la TIR?
            </span>
            <UiTooltip>
              <TooltipTrigger asChild>
                <span className="underline cursor-help text-purple-700">
                  (info)
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                La <b>Tasa Interna de Retorno (TIR)</b> es la tasa a la que el
                VAN es cero. Es el rendimiento efectivo anual del bono
                considerando todos los flujos.
              </TooltipContent>
            </UiTooltip>
          </div>
        </TooltipProvider>
      </div>
      {loading ? (
        <div className="text-center py-8 text-blue-600">Cargando bonos...</div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bonosFiltradosOrdenados.map((bono) => (
              <label
                key={bono.id}
                className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2 cursor-pointer border border-blue-100 hover:bg-blue-100 transition"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(bono.id)}
                  onChange={() => handleSelect(bono.id)}
                  className="accent-blue-600 w-4 h-4 rounded"
                />
                <span className="font-medium text-blue-900">{bono.nombre}</span>
                <span className="text-xs text-gray-500 ml-auto">
                  {bono.moneda} - {bono.valorNominal}
                </span>
              </label>
            ))}
          </div>

          {bonosSeleccionados.length > 0 ? (
            <>
              <div className="overflow-x-auto mt-8 rounded-xl border shadow bg-white">
                <table className="min-w-full text-sm text-center">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="p-2 text-left">Característica</th>
                      {bonosSeleccionados.map((bono) => (
                        <th
                          key={bono.id}
                          className="p-2 text-blue-800 font-semibold"
                        >
                          {bono.nombre}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {campos.map((campo) => (
                      <tr key={campo.key} className="border-b hover:bg-blue-50">
                        <td className="p-2 text-left font-medium text-gray-700 flex items-center gap-1">
                          {campo.label}
                          {(() => {
                            switch (campo.key) {
                              case "tasaMercado":
                                return (
                                  <UiTooltip>
                                    <TooltipTrigger asChild>
                                      <span className="ml-1 cursor-help text-blue-700">
                                        ⓘ
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs text-xs">
                                      <b>TREA</b>: Tasa de Rendimiento Efectiva
                                      Anual. Representa el rendimiento real
                                      considerando todos los costos y
                                      comisiones.
                                    </TooltipContent>
                                  </UiTooltip>
                                );
                              case "comisionEmisor":
                                return (
                                  <UiTooltip>
                                    <TooltipTrigger asChild>
                                      <span className="ml-1 cursor-help text-blue-700">
                                        ⓘ
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs text-xs">
                                      Comisión que paga el emisor al colocar el
                                      bono.
                                    </TooltipContent>
                                  </UiTooltip>
                                );
                              case "comisionBonista":
                                return (
                                  <UiTooltip>
                                    <TooltipTrigger asChild>
                                      <span className="ml-1 cursor-help text-blue-700">
                                        ⓘ
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs text-xs">
                                      Comisión que paga el inversionista al
                                      comprar el bono.
                                    </TooltipContent>
                                  </UiTooltip>
                                );
                              case "tasaAnual":
                                return (
                                  <UiTooltip>
                                    <TooltipTrigger asChild>
                                      <span className="ml-1 cursor-help text-blue-700">
                                        ⓘ
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs text-xs">
                                      Tasa de interés anual nominal o efectiva,
                                      según el tipo de tasa.
                                    </TooltipContent>
                                  </UiTooltip>
                                );
                              case "van":
                                return (
                                  <UiTooltip>
                                    <TooltipTrigger asChild>
                                      <span className="ml-1 cursor-help text-blue-700">
                                        ⓘ
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs text-xs">
                                      <b>VAN</b>: Valor Actual Neto. Suma de los
                                      flujos descontados a la tasa seleccionada.
                                    </TooltipContent>
                                  </UiTooltip>
                                );
                              case "tir":
                                return (
                                  <UiTooltip>
                                    <TooltipTrigger asChild>
                                      <span className="ml-1 cursor-help text-blue-700">
                                        ⓘ
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs text-xs">
                                      <b>TIR</b>: Tasa Interna de Retorno. Tasa
                                      a la que el VAN es cero.
                                    </TooltipContent>
                                  </UiTooltip>
                                );
                              default:
                                return null;
                            }
                          })()}
                        </td>
                        {bonosSeleccionados.map((bono) => {
                          let value: React.ReactNode = "-";
                          if (campo.key === "fechaEmision") {
                            value = formatDate(bono.fechaEmision);
                          } else if (campo.key === "valorNominal") {
                            value = `${
                              bono.moneda
                            } ${bono.valorNominal.toLocaleString("es-PE", {
                              minimumFractionDigits: 2,
                            })}`;
                          } else if (
                            [
                              "tasaAnual",
                              "comisionEmisor",
                              "comisionBonista",
                              "tasaMercado",
                            ].includes(campo.key)
                          ) {
                            const v = (
                              bono as unknown as Record<string, unknown>
                            )[campo.key];
                            value = `${typeof v === "number" ? v : 0}%`;
                          } else if (campo.key in bono) {
                            const v = (
                              bono as unknown as Record<string, unknown>
                            )[campo.key];
                            value = v !== undefined ? String(v) : "-";
                          }
                          return (
                            <td key={bono.id + campo.key} className="p-2">
                              {value}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Análisis de Rentabilidad
                </h3>
                {bonosSeleccionados.length === 1 ? (
                  <div className="bg-white rounded-lg shadow p-4">
                    <h4 className="text-md font-semibold text-gray-800 mb-2">
                      Flujo de Caja
                    </h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={rentabilidad[bonosSeleccionados[0].id].flujo}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="periodo" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar
                          dataKey="cuota"
                          fill="#4f46e5"
                          name="Flujo Total"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="interes"
                          fill="#6366f1"
                          name="Interés"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="amortizacion"
                          fill="#818cf8"
                          name="Amortización"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm text-gray-700">
                      <div>
                        <span className="font-medium text-gray-800">VAN:</span>{" "}
                        {`${bonosSeleccionados[0].moneda} ${rentabilidad[
                          bonosSeleccionados[0].id
                        ].van.toLocaleString("es-PE", {
                          minimumFractionDigits: 2,
                        })}`}
                      </div>
                      <div>
                        <span className="font-medium text-gray-800">TIR:</span>{" "}
                        {`${rentabilidad[bonosSeleccionados[0].id].tir.toFixed(
                          2
                        )}%`}
                      </div>
                      <div>
                        <span className="font-medium text-gray-800">
                          Plazo:
                        </span>{" "}
                        {`${bonosSeleccionados[0].plazo} años`}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bonosSeleccionados.map((bono) => (
                      <div
                        key={bono.id}
                        className="bg-white rounded-lg shadow p-4"
                      >
                        <h4 className="text-md font-semibold text-gray-800 mb-2">
                          {bono.nombre}
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                          <div>
                            <span className="font-medium text-gray-800">
                              VAN:
                            </span>{" "}
                            {`${bono.moneda} ${rentabilidad[
                              bono.id
                            ].van.toLocaleString("es-PE", {
                              minimumFractionDigits: 2,
                            })}`}
                          </div>
                          <div>
                            <span className="font-medium text-gray-800">
                              TIR:
                            </span>{" "}
                            {`${rentabilidad[bono.id].tir.toFixed(2)}%`}
                          </div>
                          <div>
                            <span className="font-medium text-gray-800">
                              Plazo:
                            </span>{" "}
                            {`${bono.plazo} años`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-10">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Simulador de Inversión
                </h3>
                <div className="flex items-center gap-4 mb-4">
                  <label className="text-sm text-gray-700 font-medium">
                    Monto a invertir:
                  </label>
                  <Input
                    type="number"
                    min={100}
                    step={100}
                    value={montoInversion}
                    onChange={(e) => setMontoInversion(Number(e.target.value))}
                    className="w-32"
                  />
                  <span className="text-xs text-gray-500">
                    (Simula el flujo de caja y ganancia para el monto ingresado)
                  </span>
                  <Button
                    variant="outline"
                    className="ml-auto flex items-center gap-2"
                    onClick={exportarSimulacionPDF}
                    disabled={simulaciones.length === 0}
                  >
                    <Download className="w-4 h-4" /> Exportar simulación
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {simulaciones.map(
                    ({ bono, flujoSimulado, totalGanancia }) => (
                      <Card key={bono.id} className="p-4">
                        <h4 className="font-semibold text-blue-800 mb-2">
                          {bono.nombre}
                        </h4>
                        <div className="text-sm mb-2">
                          <b>Ganancia total estimada:</b> {bono.moneda}{" "}
                          {totalGanancia.toLocaleString("es-PE", {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-xs text-center border border-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="border px-2 py-1">Periodo</th>
                                <th className="border px-2 py-1">Cuota</th>
                                <th className="border px-2 py-1">Interés</th>
                                <th className="border px-2 py-1">
                                  Amortización
                                </th>
                                <th className="border px-2 py-1">Saldo</th>
                              </tr>
                            </thead>
                            <tbody>
                              {flujoSimulado.map((f) => (
                                <tr key={f.periodo}>
                                  <td className="border px-2 py-1">
                                    {f.periodo}
                                  </td>
                                  <td className="border px-2 py-1">
                                    {bono.moneda}{" "}
                                    {f.cuota.toLocaleString("es-PE", {
                                      minimumFractionDigits: 2,
                                    })}
                                  </td>
                                  <td className="border px-2 py-1">
                                    {bono.moneda}{" "}
                                    {f.interes.toLocaleString("es-PE", {
                                      minimumFractionDigits: 2,
                                    })}
                                  </td>
                                  <td className="border px-2 py-1">
                                    {bono.moneda}{" "}
                                    {f.amortizacion.toLocaleString("es-PE", {
                                      minimumFractionDigits: 2,
                                    })}
                                  </td>
                                  <td className="border px-2 py-1">
                                    {bono.moneda}{" "}
                                    {f.saldo.toLocaleString("es-PE", {
                                      minimumFractionDigits: 2,
                                    })}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Card>
                    )
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="mt-8 text-center text-gray-500">
              Selecciona uno o más bonos para comparar.
            </div>
          )}
        </>
      )}
    </Card>
  );
}
