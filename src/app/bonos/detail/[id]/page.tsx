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

export default function DetalleBonoPage() {
  const { firebaseUser } = useCurrentUser();
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
    if (!firebaseUser || !id) return;

    const ref = doc(db, "bonds", String(id));
    getDoc(ref).then((snap) => {
      if (snap.exists()) {
        const data = snap.data() as BonoData;
        if (data.userId === firebaseUser.uid) {
          setBono(data);
        } else {
          alert("No tienes permiso para ver este bono.");
          router.push("/bonos/list");
        }
      } else {
        alert("El bono no existe.");
        router.push("/bonos/list");
      }
    });
  }, [firebaseUser, id, router]);

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
      </main>
    </ProtectedRoute>
  );
}
