"use client";

import { Calendar, Clock, DollarSign, AlertTriangle } from "lucide-react";
import { Card } from "./card";

interface VencimientoInfo {
  fecha: string;
  fechaFormatted: string;
  nombre: string;
  valor: number;
  moneda: string;
  diasRestantes: number;
}

interface ProximosVencimientosProps {
  vencimientos: VencimientoInfo[];
  tipoUsuario: "emisor" | "inversionista";
}

export default function ProximosVencimientos({
  vencimientos,
  tipoUsuario,
}: ProximosVencimientosProps) {
  if (!vencimientos || vencimientos.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">
            Próximos Vencimientos
          </h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No hay vencimientos próximos</p>
        </div>
      </Card>
    );
  }

  const getUrgencyColor = (dias: number) => {
    if (dias <= 7) return "text-red-600 bg-red-50 border-red-200";
    if (dias <= 30) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    if (dias <= 90) return "text-blue-600 bg-blue-50 border-blue-200";
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  const getUrgencyIcon = (dias: number) => {
    if (dias <= 7) return <AlertTriangle className="w-4 h-4" />;
    if (dias <= 30) return <Clock className="w-4 h-4" />;
    return <Calendar className="w-4 h-4" />;
  };

  const formatCurrency = (valor: number, moneda: string) => {
    const symbol =
      moneda === "PEN" ? "S/" : moneda === "USD" ? "$" : moneda + " ";
    return `${symbol}${valor.toLocaleString()}`;
  };

  const getTitleByRole = () => {
    return tipoUsuario === "emisor"
      ? "Próximos Vencimientos de mis Bonos"
      : "Próximos Vencimientos en el Mercado";
  };

  const getSubtitleByRole = () => {
    return tipoUsuario === "emisor"
      ? "Bonos que debes cancelar próximamente"
      : "Oportunidades de inversión que vencen pronto";
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
          <Calendar className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {getTitleByRole()}
          </h3>
          <p className="text-sm text-gray-600">{getSubtitleByRole()}</p>
        </div>
      </div>

      <div className="space-y-4">
        {vencimientos.map((vencimiento, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border-2 ${getUrgencyColor(
              vencimiento.diasRestantes
            )}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getUrgencyIcon(vencimiento.diasRestantes)}
                  <h4 className="font-semibold text-sm">
                    {vencimiento.nombre}
                  </h4>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span className="font-medium">
                      {vencimiento.fechaFormatted}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    <span className="font-medium">
                      {formatCurrency(vencimiento.valor, vencimiento.moneda)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg font-bold">
                  {vencimiento.diasRestantes}
                </div>
                <div className="text-xs font-medium">
                  {vencimiento.diasRestantes === 1 ? "día" : "días"}
                </div>
              </div>
            </div>

            {/* Barra de urgencia */}
            <div className="mt-3 h-1.5 bg-black/10 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  vencimiento.diasRestantes <= 7
                    ? "bg-red-500"
                    : vencimiento.diasRestantes <= 30
                    ? "bg-yellow-500"
                    : vencimiento.diasRestantes <= 90
                    ? "bg-blue-500"
                    : "bg-gray-400"
                }`}
                style={{
                  width: `${Math.max(
                    5,
                    Math.min(
                      100,
                      ((365 - vencimiento.diasRestantes) / 365) * 100
                    )
                  )}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {vencimientos.length > 0 && (
        <div className="mt-6 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>≤7 días: Crítico</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>≤30 días: Urgente</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>≤90 días: Próximo</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
