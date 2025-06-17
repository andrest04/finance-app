"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/RouteGuard";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { Card } from "@/components/ui/card";
import ProximosVencimientos from "@/components/ui/ProximosVencimientos";
import { useRouter } from "next/navigation";
import {
  PlusCircle,
  List,
  BarChart2,
  DollarSign,
  Calendar,
  Percent,
} from "lucide-react";
import {
  getBonoStats,
  getRecentActivity,
  type BonoData,
} from "@/lib/bonoUtils";
import { formatDate } from "@/lib/utils";

export default function EmisorDashboard() {
  const { profile, firebaseUser } = useCurrentUser();
  const router = useRouter();
  const [stats, setStats] = useState<{
    totalBonos: number;
    proximoVencimiento: string;
    bonosActivos: number;
    valoresPorMoneda: Record<string, number>;
    proximosVencimientos: {
      fecha: string;
      fechaFormatted: string;
      nombre: string;
      valor: number;
      moneda: string;
      diasRestantes: number;
    }[];
  } | null>(null);
  const [recentActivity, setRecentActivity] = useState<
    (BonoData & { id: string })[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!firebaseUser) return;
      try {
        const [statsData, activityData] = await Promise.all([
          getBonoStats(firebaseUser.uid),
          getRecentActivity(firebaseUser.uid),
        ]);
        setStats(statsData);
        setRecentActivity(activityData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [firebaseUser]);
  const quickActions = [
    {
      title: "Registrar Nuevo Bono",
      description: "Crea y publica un nuevo bono corporativo",
      icon: PlusCircle,
      href: "/bonos/register",
      color: "bg-green-500",
    },
    {
      title: "Mis Bonos",
      description: "Gestiona tus bonos registrados",
      icon: List,
      href: "/bonos/list",
      color: "bg-blue-500",
    },
    {
      title: "Análisis de Bonos",
      description: "Analiza y compara el rendimiento de tus bonos",
      icon: BarChart2,
      href: "/bonos/analisis",
      color: "bg-purple-500",
    },
  ];
  const portfolioStats = [
    {
      title: "Bonos Activos",
      value: stats ? stats.bonosActivos.toString() : "-",
      icon: DollarSign,
      color: "text-blue-600",
    },
    {
      title: "Valor Total Emitido",
      value:
        stats && Object.keys(stats.valoresPorMoneda).length > 0
          ? Object.entries(stats.valoresPorMoneda)
              .map(
                ([moneda, valor]) =>
                  `${
                    moneda === "PEN"
                      ? "S/"
                      : moneda === "USD"
                      ? "$"
                      : moneda + " "
                  }${valor.toLocaleString()}`
              )
              .join(" | ")
          : "-",
      icon: Percent,
      color: "text-green-600",
    },
    {
      title: "Próximo Vencimiento",
      value: stats ? stats.proximoVencimiento : "-",
      icon: Calendar,
      color: "text-purple-600",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos del dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole="emisor">
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              ¡Bienvenido, {profile?.firstName}!
            </h1>
            <p className="text-gray-600">
              Gestiona tus bonos corporativos y monitorea su rendimiento
            </p>
          </div>
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action) => (
              <Card
                key={action.title}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(action.href)}
              >
                <div
                  className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}
                >
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{action.title}</h3>
                <p className="text-gray-600">{action.description}</p>
              </Card>
            ))}
          </div>{" "}
          {/* Portfolio Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {portfolioStats.map((stat) => (
              <Card key={stat.title} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 mb-1">{stat.title}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>
                      {stat.value}
                    </p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </Card>
            ))}
          </div>
          {/* Próximos Vencimientos */}
          {stats && stats.proximosVencimientos && (
            <ProximosVencimientos
              vencimientos={stats.proximosVencimientos}
              tipoUsuario="emisor"
            />
          )}
          {/* Recent Activity */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Actividad Reciente</h2>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((bono) => (
                  <div
                    key={bono.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{bono.nombre}</p>
                      <p className="text-sm text-gray-600">
                        Registrado el {formatDate(bono.creadoEn)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/bonos/edit/${bono.id}`)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => router.push(`/bonos/detail/${bono.id}`)}
                        className="text-gray-600 hover:text-gray-700"
                      >
                        Ver detalles
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">
                  No hay actividad reciente para mostrar
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
