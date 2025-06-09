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

  return (
    <Card className="p-6 max-w-6xl mx-auto mt-6">
      <h2 className="text-xl font-bold mb-4 text-blue-800">
        Comparador de Bonos
      </h2>
      <div className="mb-4 flex flex-col md:flex-row md:items-center gap-4">
        <label className="flex items-center gap-2">
          <span className="text-sm text-gray-700">
            Tasa de descuento para VAN:
          </span>
          <input
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
            {bonos.map((bono) => (
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
                        <td className="p-2 text-left font-medium text-gray-700">
                          {campo.label}
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
