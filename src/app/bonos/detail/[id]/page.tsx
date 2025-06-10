"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { Button } from "@/components/ui/button";
import type { BonoData } from "@/lib/bonoUtils";
import ProtectedRoute from "@/components/RouteGuard";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  calcularDuracion,
  calcularDuracionModificada,
  calcularConvexidad,
  FlujoBono,
} from "@/lib/indicadoresBono";
import { calcularFlujoFrances } from "@/lib/francesMetod";
import { calcularTCEABono } from "@/lib/bonoUtils";

export default function DetalleBonoPage() {
  const { firebaseUser, profile } = useCurrentUser();
  const { id } = useParams();
  const router = useRouter();
  const [bono, setBono] = useState<BonoData | null>(null);

  const etiquetasBonito: { [key: string]: string } = {
    nombre: "Nombre del Bono",
    valorNominal: "Valor Nominal (VN)",
    moneda: "Moneda",
    tipoTasa: "Tipo de Tasa",
    tasaAnual: "Tasa Anual (%)",
    frecuenciaPago: "Frecuencia de Pago",
    frecuenciaCapitalizacion: "Frecuencia de Capitalización",
    plazo: "Plazo (años)",
    tipoGracia: "Tipo de Gracia",
    nGracia: "N° Periodos de Gracia",
    fechaEmision: "Fecha de Emisión",
    comisionEmisor: "Comisión del Emisor (%)",
    comisionBonista: "Comisión del Bonista (%)",
    tasaMercado: "Tasa de Mercado (TREA)",
    creadoEn: "Fecha de Registro",
  };

  const secciones: { [key: string]: string[] } = {
    "Datos Básicos": [
      "nombre",
      "moneda",
      "valorNominal",
      "plazo",
      "fechaEmision",
    ],
    "Tasa y Frecuencia": [
      "tipoTasa",
      "tasaAnual",
      "frecuenciaPago",
      "frecuenciaCapitalizacion",
    ],
    "Plazo y Gracia": ["tipoGracia", "nGracia"],
    "Costos y Mercado": ["comisionEmisor", "comisionBonista", "tasaMercado"],
  };

  const frecuenciaTexto: { [key: string]: string } = {
    "360": "Diaria",
    "12": "Mensual",
    "6": "Bimestral",
    "4": "Trimestral",
    "3": "Cuatrimestral",
    "2": "Semestral",
    "1": "Anual",
  };

  const formatPercentage = (value: number | string) =>
    `${parseFloat(String(value)).toFixed(2)} %`;

  const formatCurrency = (value: number | string) =>
    `${parseFloat(String(value)).toLocaleString("es-PE", {
      minimumFractionDigits: 2,
    })}`;

  const formatInteger = (value: number | string, suffix = "") =>
    `${parseInt(String(value))}${suffix}`;

  useEffect(() => {
    if (!firebaseUser || !id || !profile) return;

    const ref = doc(db, "bonds", String(id));
    getDoc(ref).then((snap) => {
      if (snap.exists()) {
        const data = snap.data() as BonoData;
        if (profile.role === "emisor") {
          if (data.userId === firebaseUser.uid) {
            setBono(data);
          } else {
            alert("No tienes permiso para ver este bono.");
            router.push("/bonos/list");
          }
        } else if (profile.role === "inversionista") {
          setBono(data); // El inversionista puede ver cualquier bono
        } else {
          alert("No tienes permiso para ver este bono.");
          router.push("/bonos/list");
        }
      } else {
        alert("El bono no existe.");
        router.push("/bonos/list");
      }
    });
  }, [firebaseUser, id, router, profile]);
  // --- Indicadores financieros: duración, duración modificada, convexidad y TCEA ---
  let indicadores = null;
  let tcea = 0;
  if (bono) {
    // Solo método francés por ahora
    const mapGracia = (tipo: string): "Ninguno" | "Total" | "Parcial" => {
      if (tipo === "Sin Gracia" || tipo === "Ninguno") return "Ninguno";
      if (tipo === "Total") return "Total";
      if (tipo === "Parcial") return "Parcial";
      return "Ninguno";
    };
    const flujo = calcularFlujoFrances({
      valorNominal: bono.valorNominal,
      tasaAnual: bono.tasaAnual,
      frecuenciaPago: bono.frecuenciaPago,
      plazo: bono.plazo,
      gracia: mapGracia(bono.tipoGracia),
      numPeriodosGracia: bono.nGracia || 0,
    });
    // Convertir a formato FlujoBono (periodo, flujo)
    const flujos: FlujoBono[] = flujo.map((f) => ({
      periodo: f.periodo,
      flujo: f.cuota,
    }));
    // Usar tasa de mercado como tasa de descuento (en decimal por periodo)
    const tasaPeriodo = bono.tasaMercado / 100 / bono.frecuenciaPago;
    indicadores = {
      duracion: calcularDuracion(flujos, tasaPeriodo),
      duracionMod: calcularDuracionModificada(flujos, tasaPeriodo),
      convexidad: calcularConvexidad(flujos, tasaPeriodo),
    };

    // Calcular TCEA
    tcea = calcularTCEABono(bono);
  }

  if (!firebaseUser)
    return <p className="p-6 text-center">Cargando sesión...</p>;
  if (!bono) return <p className="p-6 text-center">Cargando bono...</p>;

  return (
    <ProtectedRoute requiredRole={undefined}>
      <main className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            📄 Detalle del Bono
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0} className="cursor-pointer">
                  <Info className="w-5 h-5 text-blue-400" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                Aquí puedes ver todos los datos y condiciones del bono. Haz clic
                en los íconos de ayuda para más información.
              </TooltipContent>
            </Tooltip>
          </h1>
          <Button onClick={() => router.push("/bonos/list")}>
            ← Volver a la lista
          </Button>
        </div>

        {Object.entries(secciones).map(([titulo, campos]) => (
          <section key={titulo} className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-blue-700">{titulo}</h2>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0} className="cursor-pointer">
                    <Info className="w-4 h-4 text-blue-400" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Información sobre {titulo.toLowerCase()}.
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {campos.map((campo) => {
                const typedCampo = campo as keyof BonoData;
                let valor = "";
                if (
                  campo === "frecuenciaPago" ||
                  campo === "frecuenciaCapitalizacion"
                ) {
                  valor =
                    frecuenciaTexto[String(bono[typedCampo])] ||
                    String(bono[typedCampo] ?? "");
                } else if (
                  typeof bono[typedCampo] === "object" &&
                  bono[typedCampo] !== null &&
                  "seconds" in bono[typedCampo]
                ) {
                  valor = new Date(
                    (bono[typedCampo] as { seconds: number }).seconds * 1000
                  ).toLocaleDateString("es-PE");
                } else if (
                  [
                    "tasaAnual",
                    "tasaMercado",
                    "comisionEmisor",
                    "comisionBonista",
                  ].includes(campo)
                ) {
                  valor = formatPercentage(bono[typedCampo] ?? 0);
                } else if (campo === "valorNominal") {
                  valor = formatCurrency(bono[typedCampo] ?? 0);
                } else if (["plazo", "nGracia"].includes(campo)) {
                  valor = formatInteger(bono[typedCampo] ?? "");
                } else if (
                  typeof bono[typedCampo] === "object" ||
                  typeof bono[typedCampo] === "undefined"
                ) {
                  valor = "-";
                } else {
                  valor = String(bono[typedCampo]);
                }
                // Badge visual para campos clave
                let badge = null;
                if (campo === "tipoGracia") {
                  badge = (
                    <span
                      className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${
                        valor === "Total"
                          ? "bg-blue-100 text-blue-700"
                          : valor === "Parcial"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {valor}
                    </span>
                  );
                }
                if (campo === "tipoTasa") {
                  badge = (
                    <span
                      className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${
                        valor === "Nominal"
                          ? "bg-green-100 text-green-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {valor}
                    </span>
                  );
                }
                if (campo === "moneda") {
                  badge = (
                    <span className="ml-2 px-2 py-0.5 rounded text-xs font-semibold bg-gray-200 text-gray-700">
                      {valor}
                    </span>
                  );
                }
                return (
                  <div
                    key={campo}
                    className="border border-gray-200 rounded-xl shadow-sm p-4 bg-white flex flex-col gap-1"
                  >
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                        {etiquetasBonito[campo] || campo}
                      </p>
                      {badge}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span tabIndex={0} className="cursor-pointer">
                            <Info className="w-3 h-3 text-gray-400" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          ¿Qué significa {etiquetasBonito[campo] || campo}?
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-base text-gray-800 break-words font-mono">
                      {valor}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {/* Indicadores financieros */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-blue-700">
              Indicadores Financieros
            </h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0} className="cursor-pointer">
                  <Info className="w-4 h-4 text-blue-400" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                Duración, duración modificada y convexidad del bono calculadas
                con el método francés y la TREA.
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Duración */}
            <div className="border border-gray-200 rounded-xl shadow-sm p-4 bg-white">
              <div className="flex items-center gap-1 mb-1">
                <p className="text-xs font-semibold text-gray-500 uppercase">
                  Duración
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} className="cursor-pointer">
                      <Info className="w-3 h-3 text-gray-400" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    Mide la sensibilidad del precio del bono ante cambios en la
                    tasa de interés. Una duración mayor implica mayor riesgo
                    ante subas de tasas.
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-base text-gray-800 font-mono">
                {indicadores ? indicadores.duracion.toFixed(4) : "-"} años
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Indica el plazo promedio ponderado en que se recupera la
                inversión.
              </p>
            </div>
            {/* Duración Modificada */}
            <div className="border border-gray-200 rounded-xl shadow-sm p-4 bg-white">
              <div className="flex items-center gap-1 mb-1">
                <p className="text-xs font-semibold text-gray-500 uppercase">
                  Duración Modificada
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} className="cursor-pointer">
                      <Info className="w-3 h-3 text-gray-400" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    Estima el cambio porcentual en el precio del bono ante una
                    variación de 1% en la tasa de interés.
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-base text-gray-800 font-mono">
                {indicadores ? indicadores.duracionMod.toFixed(4) : "-"} años
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Útil para estimar la variación del precio ante cambios en tasas.
              </p>
            </div>
            {/* Convexidad */}
            <div className="border border-gray-200 rounded-xl shadow-sm p-4 bg-white">
              <div className="flex items-center gap-1 mb-1">
                <p className="text-xs font-semibold text-gray-500 uppercase">
                  Convexidad
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} className="cursor-pointer">
                      <Info className="w-3 h-3 text-gray-400" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    Mide la curvatura en la relación precio-tasa. Una mayor
                    convexidad indica menor riesgo ante grandes movimientos de
                    tasas.
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-base text-gray-800 font-mono">
                {indicadores ? indicadores.convexidad.toFixed(4) : "-"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Complementa a la duración para medir el riesgo de tasa de
                interés.
              </p>{" "}
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            <span>
              Estos indicadores ayudan a medir el riesgo y sensibilidad del bono
              ante cambios en la tasa de interés.
            </span>
          </div>
        </section>

        {/* Análisis de Costos y Rentabilidad */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-blue-700">
              Análisis de Costos y Rentabilidad
            </h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0} className="cursor-pointer">
                  <Info className="w-4 h-4 text-blue-400" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                Análisis desde la perspectiva del emisor (TCEA) y del
                inversionista (TREA).
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {/* TCEA */}
            <div className="border border-gray-200 rounded-xl shadow-sm p-4 bg-white">
              <div className="flex items-center gap-1 mb-1">
                <p className="text-xs font-semibold text-gray-500 uppercase">
                  TCEA (Tasa de Coste Efectivo Anual)
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} className="cursor-pointer">
                      <Info className="w-3 h-3 text-gray-400" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    Tasa de coste efectivo anual desde el punto de vista del
                    emisor. Incluye todas las comisiones y costos asociados a la
                    emisión del bono.
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-base text-gray-800 font-mono">
                {tcea.toFixed(4)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Costo real anual para el emisor considerando todas las
                comisiones.
              </p>
            </div>
            {/* TREA */}
            <div className="border border-gray-200 rounded-xl shadow-sm p-4 bg-white">
              <div className="flex items-center gap-1 mb-1">
                <p className="text-xs font-semibold text-gray-500 uppercase">
                  TREA (Tasa de Rendimiento Efectivo Anual)
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} className="cursor-pointer">
                      <Info className="w-3 h-3 text-gray-400" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    Tasa de rendimiento efectivo anual desde el punto de vista
                    del inversionista. Incluye todas las comisiones y costos del
                    bonista.
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-base text-gray-800 font-mono">
                {bono.tasaMercado.toFixed(4)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Rendimiento real anual para el inversionista considerando
                comisiones.
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            <span>
              La TCEA muestra el costo real del financiamiento para el emisor,
              mientras que la TREA muestra el rendimiento real para el
              inversionista.
            </span>
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}
