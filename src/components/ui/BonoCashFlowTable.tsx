import { FlujoPeriodo } from "@/lib/francesMetod";
import React from "react";

type Props = {
  data: FlujoPeriodo[];
};

const BonoCashFlowTable: React.FC<Props> = ({ data }) => {
  return (
    <div className="overflow-x-auto rounded-xl shadow-lg border p-4 bg-white">
      <h2 className="text-xl font-semibold mb-4 text-center">
        Flujo de Caja - Método Francés
      </h2>
      <table className="min-w-full text-sm text-center border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-3 py-2">Periodo</th>
            <th className="border px-3 py-2">Cuota</th>
            <th className="border px-3 py-2">Interés</th>
            <th className="border px-3 py-2">Amortización</th>
            <th className="border px-3 py-2">Saldo</th>
          </tr>
        </thead>
        <tbody>
          {data.map((fila) => (
            <tr key={fila.periodo} className="hover:bg-gray-50">
              <td className="border px-3 py-2">{fila.periodo}</td>
              <td className="border px-3 py-2">S/ {fila.cuota.toFixed(2)}</td>
              <td className="border px-3 py-2">S/ {fila.interes.toFixed(2)}</td>
              <td className="border px-3 py-2">
                S/ {fila.amortizacion.toFixed(2)}
              </td>
              <td className="border px-3 py-2">S/ {fila.saldo.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BonoCashFlowTable;
