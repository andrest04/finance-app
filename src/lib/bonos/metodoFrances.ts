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

  // Inicializar variables
  let saldo = valorNominal;
  let cuota: number;
  const flujo: FlujoPeriodo[] = [];

  // Para gracia total: primero capitalizar intereses, luego recalcular cuota
  if (gracia === "Total" && numPeriodosGracia > 0) {
    // Fase 1: Períodos de gracia total (solo capitalización de intereses)
    for (let i = 1; i <= numPeriodosGracia; i++) {
      const interes = saldo * tasaPeriodo;
      saldo += interes; // Capitalización de interés

      flujo.push({
        periodo: i,
        cuota: 0,
        interes,
        amortizacion: 0,
        saldo,
      });
    }

    // Fase 2: Recalcular cuota para períodos restantes
    const periodosRestantes = n - numPeriodosGracia;
    if (periodosRestantes > 0) {
      cuota =
        saldo *
        (tasaPeriodo / (1 - Math.pow(1 + tasaPeriodo, -periodosRestantes)));

      // Fase 3: Períodos con pagos normales (método francés)
      for (let i = numPeriodosGracia + 1; i <= n; i++) {
        const interes = saldo * tasaPeriodo;
        const amortizacion = cuota - interes;
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
  } else {
    // Caso normal (sin gracia o gracia parcial)
    cuota = valorNominal * (tasaPeriodo / (1 - Math.pow(1 + tasaPeriodo, -n)));

    for (let i = 1; i <= n; i++) {
      const interes = saldo * tasaPeriodo;
      const amortizacion = cuota - interes;

      if (gracia === "Parcial" && i <= numPeriodosGracia) {
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

export type GraciaDinamicaPeriod = {
  desde: number;
  hasta: number;
  tipoGracia: "Sin Gracia" | "Parcial" | "Total";
};

export type BonoParamsDinamico = {
  valorNominal: number;
  tasaAnual: number;
  frecuenciaPago: number;
  plazo: number;
  graciasPorPeriodo: GraciaDinamicaPeriod[];
};

/**
 * Calcula los flujos de caja usando el método francés con períodos de gracia dinámicos
 * Permite diferentes tipos de gracia por períodos específicos
 */
export function calcularFlujoFrancesDinamico(
  params: BonoParamsDinamico
): FlujoPeriodo[] {
  const { valorNominal, tasaAnual, frecuenciaPago, plazo, graciasPorPeriodo } =
    params;

  const n = plazo * frecuenciaPago;
  const tasaPeriodo = tasaAnual / 100 / frecuenciaPago;

  // Crear mapa de tipos de gracia por período
  const tipoGraciaPorPeriodo: {
    [key: number]: "Sin Gracia" | "Parcial" | "Total";
  } = {};

  // Inicializar todos los períodos como "Sin Gracia"
  for (let i = 1; i <= n; i++) {
    tipoGraciaPorPeriodo[i] = "Sin Gracia";
  }

  // Aplicar configuraciones de gracia dinámica
  graciasPorPeriodo.forEach((gracia) => {
    for (let i = gracia.desde; i <= gracia.hasta && i <= n; i++) {
      tipoGraciaPorPeriodo[i] = gracia.tipoGracia;
    }
  });

  let saldo = valorNominal;
  const flujo: FlujoPeriodo[] = [];

  // PASO 1: Procesar períodos de gracia total (capitalización)
  for (let i = 1; i <= n; i++) {
    if (tipoGraciaPorPeriodo[i] === "Total") {
      const interes = saldo * tasaPeriodo;
      saldo += interes; // Capitalizar intereses

      flujo.push({
        periodo: i,
        cuota: 0,
        interes,
        amortizacion: 0,
        saldo,
      });
    }
  }

  // PASO 2: Calcular cuota constante para períodos sin gracia
  const periodosConPago = Object.values(tipoGraciaPorPeriodo).filter(
    (tipo) => tipo === "Sin Gracia"
  ).length;

  let cuotaConstante = 0;
  if (periodosConPago > 0) {
    // Calcular cuota basada en el saldo actual (que puede estar capitalizado)
    cuotaConstante =
      saldo * (tasaPeriodo / (1 - Math.pow(1 + tasaPeriodo, -periodosConPago)));
  }

  // PASO 3: Procesar períodos de gracia parcial y sin gracia
  let saldoTrabajo = saldo;
  for (let i = 1; i <= n; i++) {
    const tipoGracia = tipoGraciaPorPeriodo[i];

    // Si ya procesamos este período en la fase de gracia total, continuar
    if (tipoGracia === "Total") {
      continue;
    }

    const interes = saldoTrabajo * tasaPeriodo;

    if (tipoGracia === "Parcial") {
      // Gracia parcial: solo se pagan intereses
      flujo.push({
        periodo: i,
        cuota: interes,
        interes,
        amortizacion: 0,
        saldo: saldoTrabajo,
      });
    } else {
      // Sin gracia: pago normal del método francés
      const amortizacion = cuotaConstante - interes;
      saldoTrabajo -= amortizacion;

      flujo.push({
        periodo: i,
        cuota: cuotaConstante,
        interes,
        amortizacion,
        saldo: saldoTrabajo < 1e-6 ? 0 : saldoTrabajo,
      });
    }
  }

  // Ordenar flujos por período
  flujo.sort((a, b) => a.periodo - b.periodo);

  return flujo;
}
