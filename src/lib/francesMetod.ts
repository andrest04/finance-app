/**
 * Cálculo de flujos de caja utilizando el Método Francés
 *
 * El método francés se caracteriza por:
 * - Cuotas constantes durante toda la vida del bono
 * - La amortización aumenta y los intereses disminuyen en cada período
 * - Fórmula basada en anualidades con valor presente
 *
 * Este es el único método de amortización implementado en la aplicación.
 */

export type BonoParams = {
  valorNominal: number;
  tasaAnual: number; // Tasa de interés anual (%)
  frecuenciaPago: number; // N° pagos por año (ej: 2 = semestral)
  plazo: number; // En años
  gracia: "Ninguno" | "Total" | "Parcial";
  numPeriodosGracia: number; // Cuántos periodos tienen gracia
};

export type FlujoPeriodo = {
  periodo: number;
  cuota: number;
  interes: number;
  amortizacion: number;
  saldo: number;
};

export function calcularFlujoFrances(params: BonoParams): FlujoPeriodo[] {
  const {
    valorNominal,
    tasaAnual,
    frecuenciaPago,
    plazo,
    gracia,
    numPeriodosGracia,
  } = params;

  const n = plazo * frecuenciaPago;
  const tasaPeriodo = tasaAnual / 100 / frecuenciaPago;

  const cuota =
    valorNominal * (tasaPeriodo / (1 - Math.pow(1 + tasaPeriodo, -n)));

  let saldo = valorNominal;
  const flujo: FlujoPeriodo[] = [];
  for (let i = 1; i <= n; i++) {
    const interes = saldo * tasaPeriodo;
    const amortizacion = cuota - interes;

    if (gracia === "Total" && i <= numPeriodosGracia) {
      flujo.push({
        periodo: i,
        cuota: 0,
        interes,
        amortizacion: 0,
        saldo,
      });
    } else if (gracia === "Parcial" && i <= numPeriodosGracia) {
      flujo.push({
        periodo: i,
        cuota: interes,
        interes,
        amortizacion: 0,
        saldo,
      });
    } else {
      saldo -= amortizacion;
      flujo.push({
        periodo: i,
        cuota,
        interes,
        amortizacion,
        saldo: saldo < 1e-6 ? 0 : saldo,
      });
    }
  }

  // Verificación especial para gracia parcial durante todo el plazo
  if (gracia === "Parcial" && numPeriodosGracia === n) {
    // Modificar el último flujo para devolver el capital completo
    const ultimoFlujo = flujo[flujo.length - 1];
    ultimoFlujo.cuota += valorNominal;
    ultimoFlujo.amortizacion = valorNominal;
    ultimoFlujo.saldo = 0;
  }

  return flujo;
}
