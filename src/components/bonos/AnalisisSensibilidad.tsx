"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { BonoData } from "@/lib/bonoUtils";

interface AnalisisSensibilidadProps {
  bonosSeleccionados?: (BonoData & { id: string })[];
}

interface PuntoSensibilidad {
  tasa: string;
  tasaValor: number;
  [key: string]: string | number;
}

export function AnalisisSensibilidad({
  bonosSeleccionados = [],
}: AnalisisSensibilidadProps) {
  const [tasaBase, setTasaBase] = useState(0.1);
  const [variacion, setVariacion] = useState(0.02);
  const [pasos, setPasos] = useState(5);
  const [resultados, setResultados] = useState<PuntoSensibilidad[]>([]);

  useEffect(() => {
    if (!bonosSeleccionados?.length) return;

    const calcularValorPresente = (
      valorNominal: number,
      tasa: number,
      plazo: number
    ) => {
      return valorNominal / Math.pow(1 + tasa, plazo);
    };

    const nuevosResultados: PuntoSensibilidad[] = [];
    for (let i = -pasos; i <= pasos; i++) {
      const tasaVariada = tasaBase + i * variacion;
      const punto: PuntoSensibilidad = {
        tasa: (tasaVariada * 100).toFixed(2) + "%",
        tasaValor: tasaVariada,
      };

      bonosSeleccionados.forEach((bono) => {
        const valorPresente = calcularValorPresente(
          bono.valorNominal,
          tasaVariada,
          bono.plazo
        );
        const key = `${bono.nombre} (${bono.moneda})`;
        punto[key] = valorPresente;
      });

      nuevosResultados.push(punto);
    }

    setResultados(nuevosResultados);
  }, [bonosSeleccionados, tasaBase, variacion, pasos]);

  if (!bonosSeleccionados?.length) {
    return (
      <Card className="p-6">
        <p className="text-gray-500 text-center">
          Seleccione bonos para realizar el análisis de sensibilidad
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Análisis de Sensibilidad
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Este análisis muestra cómo el valor presente de los bonos
            seleccionados varía con diferentes tasas de descuento.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Tasa Base (%)</Label>
            <Input
              type="number"
              value={tasaBase * 100}
              onChange={(e) => setTasaBase(Number(e.target.value) / 100)}
              min="0"
              max="100"
              step="0.1"
            />
          </div>
          <div className="space-y-2">
            <Label>Variación (%)</Label>
            <Input
              type="number"
              value={variacion * 100}
              onChange={(e) => setVariacion(Number(e.target.value) / 100)}
              min="0"
              max="10"
              step="0.1"
            />
          </div>
          <div className="space-y-2">
            <Label>Número de Pasos</Label>
            <Input
              type="number"
              value={pasos}
              onChange={(e) => setPasos(Number(e.target.value))}
              min="1"
              max="10"
              step="1"
            />
          </div>
        </div>

        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={resultados}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tasa" />
              <YAxis />
              <Tooltip />
              <Legend />
              {bonosSeleccionados.map((bono, index) => (
                <Line
                  key={bono.id}
                  type="monotone"
                  dataKey={`${bono.nombre} (${bono.moneda})`}
                  stroke={`hsl(${
                    (index * 360) / bonosSeleccionados.length
                  }, 70%, 50%)`}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="text-sm text-gray-600">
          <p>
            <strong>Interpretación:</strong> El gráfico muestra cómo el valor
            presente de cada bono varía con diferentes tasas de descuento. Una
            pendiente más pronunciada indica mayor sensibilidad a cambios en la
            tasa de descuento.
          </p>
        </div>
      </div>
    </Card>
  );
}
