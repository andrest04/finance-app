"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/RouteGuard";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import {
  BarChart2,
  List,
  TrendingUp,
  DollarSign,
  Calendar,
  Percent,
} from "lucide-react";
import {
  getBonoStats,
  getRecentActivity,
  type BonoData,
} from "@/lib/bonoUtils";

export default function InversionistaDashboard() {
  const { profile, firebaseUser } = useCurrentUser();
  const router = useRouter();
  const [stats, setStats] = useState<{
    totalBonos: number;
    tasaPromedio: number;
    proximoVencimiento: string;
    bonosActivos: number;
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
          getBonoStats(),
          getRecentActivity(),
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
      title: "Ver Bonos Disponibles",
      description: "Explora los bonos corporativos disponibles para inversión",
      icon: List,
      href: "/bonos/list",
      color: "bg-blue-500",
    },
    {
      title: "Análisis de Bonos",
      description: "Analiza y compara diferentes bonos",
      icon: BarChart2,
      href: "/bonos/analisis",
      color: "bg-green-500",
    },
    {
      title: "Simulador de Inversión",
      description: "Simula diferentes escenarios de inversión",
      icon: TrendingUp,
      href: "/bonos/simulador",
      color: "bg-purple-500",
    },
  ];

  const marketStats = [
    {
      title: "Tasa Promedio",
      value: stats ? `${stats.tasaPromedio}%` : "-",
      icon: Percent,
      color: "text-green-600",
    },
    {
      title: "Bonos Disponibles",
      value: stats ? stats.totalBonos.toString() : "-",
      icon: DollarSign,
      color: "text-blue-600",
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
    <ProtectedRoute requiredRole="inversionista">
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              ¡Bienvenido, {profile?.firstName}!
            </h1>
            <p className="text-gray-600">
              Explora oportunidades de inversión y gestiona tu portafolio de
              bonos
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
          </div>

          {/* Market Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {marketStats.map((stat) => (
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
                        {bono.emisorNombre || "Emisor no especificado"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/bonos/detail/${bono.id}`)}
                        className="text-gray-600 hover:text-gray-700"
                        type="button"
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
