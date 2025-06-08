"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { DollarSign, Calendar, Percent, Loader2 } from "lucide-react";
import { getBonoFullStats, BonoFullStats } from "@/lib/bonoUtils";
import { useCurrentUser } from "@/lib/useCurrentUser";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const chartColors = {
  primary: "#2563eb", // azul shadcn
  grid: "#e5e7eb", // gris claro
  axis: "#6b7280", // gris medio
  tooltipBg: "#fff",
  tooltipBorder: "#e5e7eb",
  tooltipText: "#111827",
};

export default function BonoStats() {
  const { firebaseUser, profile, loading: userLoading } = useCurrentUser();
  const [stats, setStats] = useState<BonoFullStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!firebaseUser || !profile) return;
      try {
        setLoading(true);
        const stats = await getBonoFullStats(
          profile.role === "emisor" ? firebaseUser.uid : undefined
        );
        setStats(stats);
      } catch (error) {
        setError("Error al cargar las estadísticas");
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };
    if (!userLoading && firebaseUser && profile) {
      fetchStats();
    }
  }, [firebaseUser, profile, userLoading]);

  if (userLoading || loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="animate-spin h-6 w-6 text-blue-600 mr-2" />
        <span className="text-blue-700 font-medium">
          Cargando estadísticas...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Tarjetas principales
  const statsCards = [
    {
      title: "Bonos Activos",
      value: (stats.bonosActivos ?? 0).toString(),
      icon: DollarSign,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Bonos Vencidos",
      value: (stats.bonosVencidos ?? 0).toString(),
      icon: DollarSign,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
    },
    {
      title: "Valor Nominal Total",
      value: `S/ ${(stats.valorNominalTotal ?? 0).toLocaleString("es-PE", {
        minimumFractionDigits: 2,
      })}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Valor Nominal Vencido",
      value: `S/ ${(stats.valorNominalVencido ?? 0).toLocaleString("es-PE", {
        minimumFractionDigits: 2,
      })}`,
      icon: DollarSign,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Tasa Promedio",
      value: `${stats.tasaPromedio ?? 0}%`,
      icon: Percent,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Tasa Máxima",
      value: `${stats.tasaMaxima ?? 0}%`,
      icon: Percent,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Tasa Mínima",
      value: `${stats.tasaMinima ?? 0}%`,
      icon: Percent,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Próximo Vencimiento",
      value: stats.proximoVencimiento || "-",
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  // Montos por moneda
  const monedas = Object.entries(stats.montosPorMoneda);

  // Gráfico multi-moneda
  const monedasEvolucion = Object.keys(stats.evolucionMensualPorMoneda);
  const allMonths = Array.from(
    new Set(
      monedasEvolucion.flatMap((moneda) =>
        stats.evolucionMensualPorMoneda[moneda].map((e) => e.mes)
      )
    )
  ).sort();
  // Construir dataset para el gráfico: [{ mes, PEN: 1000, USD: 500, ... }, ...]
  const chartData = allMonths.map((mes) => {
    const row: Record<string, unknown> = { mes };
    monedasEvolucion.forEach((moneda) => {
      const found = stats.evolucionMensualPorMoneda[moneda].find(
        (e) => e.mes === mes
      );
      row[moneda] = found ? found.monto : 0;
    });
    return row;
  });
  const monedaColors: Record<string, string> = {
    PEN: "#2563eb", // azul
    USD: "#16a34a", // verde
    EUR: "#eab308", // amarillo
    // Puedes agregar más colores si hay más monedas
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card
            key={index}
            className="p-6 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow bg-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div
                className={`p-3 rounded-full ${stat.bgColor} flex items-center justify-center`}
              >
                <stat.icon className={`h-7 w-7 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Montos por moneda */}
      <Card className="p-6 border border-gray-200 rounded-xl shadow-sm bg-white">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Montos por Moneda
        </h3>
        <div className="flex flex-wrap gap-6">
          {monedas.length === 0 && (
            <span className="text-gray-500">No hay datos</span>
          )}
          {monedas.map(([moneda, monto]) => (
            <div key={moneda} className="flex flex-col items-center">
              <span className="text-lg font-bold text-blue-700">{moneda}</span>
              <span className="text-xl font-semibold text-gray-900">
                {(monto ?? 0).toLocaleString("es-PE", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Evolución mensual multi-moneda */}
      <Card className="p-6 border border-gray-200 rounded-xl shadow-sm bg-white">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Evolución Mensual del Monto Emitido por Moneda
        </h3>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis
                dataKey="mes"
                stroke={chartColors.axis}
                tick={{ fill: chartColors.axis, fontSize: 14, fontWeight: 500 }}
                axisLine={{ stroke: chartColors.grid }}
              />
              <YAxis
                stroke={chartColors.axis}
                tick={{ fill: chartColors.axis, fontSize: 14, fontWeight: 500 }}
                axisLine={{ stroke: chartColors.grid }}
                tickFormatter={(value: number) =>
                  value.toLocaleString("es-PE", { maximumFractionDigits: 0 })
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: chartColors.tooltipBg,
                  border: `1px solid ${chartColors.tooltipBorder}`,
                  borderRadius: "0.75rem",
                  color: chartColors.tooltipText,
                  fontWeight: 500,
                  fontSize: 15,
                  boxShadow: "0 4px 12px 0 rgba(0,0,0,0.08)",
                }}
                itemStyle={{ fontWeight: 600 }}
                labelStyle={{ color: chartColors.axis, fontWeight: 500 }}
                formatter={(value: number, name: string) => [
                  `${value.toLocaleString("es-PE", {
                    maximumFractionDigits: 2,
                  })} ${name}`,
                  name,
                ]}
              />
              <Legend />
              {monedasEvolucion.map((moneda) => (
                <Line
                  key={moneda}
                  type="monotone"
                  dataKey={moneda}
                  name={moneda}
                  stroke={monedaColors[moneda] || "#8884d8"}
                  strokeWidth={3}
                  dot={{
                    fill: monedaColors[moneda] || "#8884d8",
                    stroke: "#fff",
                    strokeWidth: 2,
                    r: 6,
                  }}
                  activeDot={{
                    r: 8,
                    fill: monedaColors[moneda] || "#8884d8",
                    stroke: "#fff",
                    strokeWidth: 3,
                  }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
