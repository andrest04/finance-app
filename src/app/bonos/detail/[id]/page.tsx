"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { Button } from "@/components/ui/button";

export default function DetalleBonoPage() {
  const { firebaseUser } = useCurrentUser();
  const { id } = useParams();
  const router = useRouter();
  const [bono, setBono] = useState<any | null>(null);

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

  const formatPercentage = (value: any) => `${parseFloat(value).toFixed(2)} %`;
  const formatCurrency = (value: any) =>
    `S/. ${parseFloat(value).toLocaleString("es-PE", {
      minimumFractionDigits: 2,
    })}`;
  const formatInteger = (value: any, suffix = "") =>
    `${parseInt(value)}${suffix}`;

  useEffect(() => {
    if (!firebaseUser || !id) return;

    const ref = doc(db, "usuarios", firebaseUser.uid, "bonos", String(id));
    getDoc(ref).then((snap) => {
      if (snap.exists()) {
        setBono(snap.data());
      } else {
        alert("El bono no existe.");
      }
    });
  }, [firebaseUser, id]);

  if (!firebaseUser)
    return <p className="p-6 text-center">Cargando sesión...</p>;
  if (!bono) return <p className="p-6 text-center">Cargando bono...</p>;

  return (
    <main className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          📄 Detalle del Bono
        </h1>
        <Button onClick={() => router.push("/bonos/list")}>
          ← Volver a la lista
        </Button>
      </div>

      {Object.entries(secciones).map(([titulo, campos]) => (
        <section key={titulo} className="space-y-3">
          <h2 className="text-lg font-semibold text-blue-700">{titulo}</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {campos.map((campo) => (
              <div
                key={campo}
                className="border border-gray-200 rounded-xl shadow-sm p-4 bg-white"
              >
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                  {etiquetasBonito[campo] || campo}
                </p>
                <p className="text-sm text-gray-800 break-words">
                  {campo === "frecuenciaPago" ||
                  campo === "frecuenciaCapitalizacion"
                    ? frecuenciaTexto[String(bono[campo])] || bono[campo]
                    : typeof bono[campo] === "object" &&
                      bono[campo] !== null &&
                      "seconds" in bono[campo]
                    ? new Date(
                        (bono[campo] as { seconds: number }).seconds * 1000
                      ).toLocaleDateString("es-PE")
                    : campo === "tasaAnual" ||
                      campo === "tasaMercado" ||
                      campo === "comisionEmisor" ||
                      campo === "comisionBonista"
                    ? formatPercentage(bono[campo])
                    : campo === "valorNominal"
                    ? formatCurrency(bono[campo])
                    : campo === "plazo" || campo === "nGracia"
                    ? formatInteger(bono[campo])
                    : String(bono[campo])}
                </p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
