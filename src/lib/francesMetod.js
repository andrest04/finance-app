// Versión JS del cálculo de flujo francés para tests
export function calcularFlujoFrances(params) {
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
  const flujo = [];

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

  return flujo;
}
