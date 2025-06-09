"use client";

import ComparadorBonos from "@/components/ui/ComparadorBonos";
import { AnalisisSensibilidad } from "@/components/bonos/AnalisisSensibilidad";
import ProtectedRoute from "@/components/RouteGuard";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import type { BonoData } from "@/lib/bonoUtils";

export default function AnalisisBonosPage() {
  const [selectedBonos, setSelectedBonos] = useState<
    (BonoData & { id: string })[]
  >([]);

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
                      inicial.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">
                      ¿Qué es la TIR?
                    </h4>
                    <p className="text-sm text-gray-600">
                      La Tasa Interna de Retorno (TIR) es la tasa de descuento
                      que hace que el VAN sea igual a cero.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">
                      ¿Qué es la Duration?
                    </h4>
                    <p className="text-sm text-gray-600">
                      La Duration mide la sensibilidad del precio del bono a los
                      cambios en las tasas de interés.
                    </p>
                  </div>
                </div>
              </Card>
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
