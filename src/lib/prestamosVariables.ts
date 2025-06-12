/**
 * Calculadora de préstamos con tasas variables y períodos de gracia
 * Ejemplo 4: Préstamo con cuota inicial, tasas variables por período
 */

export interface PrestamoVariableParams {
  precioVenta: number;
  cuotaInicialPorcentaje: number; // Porcentaje de cuota inicial
  frecuenciaPago: number; // Veces por año
  plazoAnos: number;
  plazoGraciaTotal: number; // Períodos de gracia total
  plazoGraciaParcial: number; // Períodos de gracia parcial
  tasasPorPeriodo: {
    desde: number; // Período inicial
    hasta: number; // Período final
    tasa: number; // TEA para este rango
  }[];
}

export interface FlujoPrestamo {
  periodo: number;
  tea: number;
  tes: number;
  plazoGracia: "T" | "P" | "S" | ""; // Total, Parcial, Sin gracia
  saldoInicial: number;
  interes: number;
  cuota: number;
  amortizacion: number;
  saldoFinal: number;
}

export function calcularPrestamoVariable(
  params: PrestamoVariableParams
): FlujoPrestamo[] {
  const {
    precioVenta,
    cuotaInicialPorcentaje,
    frecuenciaPago,
    plazoAnos,
    plazoGraciaTotal,
    plazoGraciaParcial,
    tasasPorPeriodo,
  } = params;

  // 1. Calcular monto a financiar
  const cuotaInicial = precioVenta * (cuotaInicialPorcentaje / 100);
  const prestamo = precioVenta - cuotaInicial;

  // 2. Calcular número total de períodos
  const totalPeriodos = plazoAnos * frecuenciaPago;

  // 3. Función para obtener TEA según el período
  const obtenerTEA = (periodo: number): number => {
    for (const rango of tasasPorPeriodo) {
      if (periodo >= rango.desde && periodo <= rango.hasta) {
        return rango.tasa;
      }
    }
    return tasasPorPeriodo[tasasPorPeriodo.length - 1].tasa; // Última tasa por defecto
  };

  // 4. Calcular TES para cada período
  const obtenerTES = (tea: number): number => {
    return Math.pow(1 + tea / 100, 1 / frecuenciaPago) - 1;
  };

  // 5. Generar flujo de caja
  const flujo: FlujoPrestamo[] = [];
  let saldo = prestamo;

  // Primero crear todos los períodos para saber el total sin gracia
  const periodosCompletos: FlujoPrestamo[] = [];

  for (let i = 1; i <= totalPeriodos; i++) {
    const tea = obtenerTEA(i);
    const tes = obtenerTES(tea);

    // Determinar tipo de período de gracia
    let plazoGracia: "T" | "P" | "S" | "" = "S";
    if (i <= plazoGraciaTotal) {
      plazoGracia = "T"; // Gracia Total
    } else if (i <= plazoGraciaTotal + plazoGraciaParcial) {
      plazoGracia = "P"; // Gracia Parcial
    }

    periodosCompletos.push({
      periodo: i,
      tea,
      tes: tes * 100,
      plazoGracia,
      saldoInicial: 0, // Se calculará después
      interes: 0,
      cuota: 0,
      amortizacion: 0,
      saldoFinal: 0,
    });
  }

  // Ahora calcular los flujos reales
  saldo = prestamo;

  for (let i = 0; i < totalPeriodos; i++) {
    const periodo = periodosCompletos[i];
    const tesDecimal = periodo.tes / 100;

    periodo.saldoInicial = saldo;
    periodo.interes = saldo * tesDecimal;
    if (periodo.plazoGracia === "T") {
      // Gracia Total: No se paga nada, el saldo crece con intereses
      periodo.cuota = 0;
      periodo.amortizacion = 0;
      saldo = saldo + periodo.interes; // El saldo crece con los intereses
    } else if (periodo.plazoGracia === "P") {
      // Gracia Parcial: Solo se pagan intereses
      periodo.cuota = periodo.interes;
      periodo.amortizacion = 0;
      // El saldo no cambia
    } else {
      // Sin gracia: Calcular cuota normal para el período restante
      const periodosRestantes = totalPeriodos - i;

      if (periodosRestantes > 0 && saldo > 0) {
        // Calcular cuota francesa para el saldo actual y períodos restantes con tasa actual
        let cuota = 0;

        if (tesDecimal === 0) {
          cuota = saldo / periodosRestantes;
        } else {
          cuota =
            saldo *
            (tesDecimal / (1 - Math.pow(1 + tesDecimal, -periodosRestantes)));
        }

        periodo.cuota = cuota;
        periodo.amortizacion = cuota - periodo.interes;
        saldo = saldo - periodo.amortizacion;

        // Ajustar saldo si es muy pequeño
        if (saldo < 1e-6) saldo = 0;
      }
    }

    periodo.saldoFinal = saldo;
    flujo.push(periodo);
  }
  return flujo;
}
