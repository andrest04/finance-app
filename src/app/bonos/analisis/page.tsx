"use client";

import ComparadorBonos from "@/components/ui/ComparadorBonos";
import { AnalisisSensibilidad } from "@/components/bonos/AnalisisSensibilidad";
import ProtectedRoute from "@/components/RouteGuard";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import type { BonoData } from "@/lib/bonoUtils";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp, AlertTriangle, Info } from "lucide-react";
import Link from "next/link";

export default function AnalisisBonosPage() {
  const [selectedBonos, setSelectedBonos] = useState<
    (BonoData & { id: string })[]
  >([]);
  const { profile } = useCurrentUser();

  return (
    <ProtectedRoute requiredRole={undefined}>
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-gray-800">
            Análisis de Bonos
          </h1>
          <p className="text-gray-600">
            Compare y analice diferentes bonos para tomar decisiones de
            inversión informadas.
          </p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ComparadorBonos onBonosSeleccionados={setSelectedBonos} />
            </div>
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">
                  Información Útil
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">
                      ¿Qué es el VAN?
                    </h4>
                    <p className="text-sm text-gray-600">
                      El Valor Actual Neto (VAN) es la diferencia entre el valor
                      actual de los flujos de efectivo futuros y la inversión
                      inicial. Un VAN positivo indica que la inversión es
                      rentable.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">
                      ¿Qué es la TIR?
                    </h4>
                    <p className="text-sm text-gray-600">
                      La Tasa Interna de Retorno (TIR) es la tasa de descuento
                      que hace que el VAN sea igual a cero. Representa la
                      rentabilidad esperada de la inversión.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">
                      ¿Qué es la Duration?
                    </h4>
                    <p className="text-sm text-gray-600">
                      La Duration mide la sensibilidad del precio del bono a los
                      cambios en las tasas de interés. Una duration más alta
                      indica mayor sensibilidad a cambios en las tasas.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">
                      ¿Qué es la Convexidad?
                    </h4>
                    <p className="text-sm text-gray-600">
                      La Convexidad mide la curvatura en la relación
                      precio-rendimiento del bono. Ayuda a estimar el cambio en
                      el precio cuando hay grandes movimientos en las tasas de
                      interés.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">
                  Consejos de Análisis
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                    <p className="text-sm text-gray-600">
                      Compare bonos con características similares para un
                      análisis más preciso.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <p className="text-sm text-gray-600">
                      Considere el riesgo crediticio del emisor y la
                      calificación del bono.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-green-500 mt-0.5" />
                    <p className="text-sm text-gray-600">
                      Analice las tendencias del mercado y las expectativas de
                      tasas de interés.
                    </p>
                  </div>
                </div>
              </Card>

              {profile?.role === "inversionista" && (
                <Card className="p-6 bg-blue-50 border-blue-200">
                  <h3 className="text-lg font-semibold mb-4 text-blue-800">
                    Simulador de Inversión
                  </h3>
                  <p className="text-sm text-blue-700 mb-4">
                    Pruebe diferentes escenarios de inversión y vea cómo afectan
                    a su rendimiento esperado.
                  </p>
                  <Link href="/bonos/simulador">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      <Calculator className="w-4 h-4 mr-2" />
                      Ir al Simulador
                    </Button>
                  </Link>
                </Card>
              )}
            </div>
          </div>

          {selectedBonos.length > 0 && (
            <div className="mt-8">
              <AnalisisSensibilidad bonosSeleccionados={selectedBonos} />
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
