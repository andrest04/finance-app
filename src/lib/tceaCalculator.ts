// Cálculo de TCEA (Tasa de Coste Efectivo Anual) desde el punto de vista del emisor
// La TCEA considera todos los costos que tiene el emisor al emitir el bono

import { calcularFlujoFrances, type BonoParams } from "./francesMetod";

export interface TCEAParams {
  valorNominal: number;
  tasaAnual: number; // Tasa de interés del bono
  frecuenciaPago: number;
  plazo: number;
  gracia: "Ninguno" | "Total" | "Parcial";
  numPeriodosGracia: number;
  comisionEmisor: number; // Comisión que paga el emisor (%)
  comisionBonista: number; // Comisión que paga el bonista (%)
}

export interface TCEAResult {
  tcea: number; // TCEA anualizada (%)
  flujoEmisor: {
    periodo: number;
    ingresoNeto: number; // Lo que realmente recibe el emisor
    pago: number; // Lo que paga el emisor
    flujoNeto: number; // Ingreso - Pago
  }[];
}

/**
 * Calcula la TCEA desde el punto de vista del emisor
 * La TCEA es la tasa que iguala el valor presente de los pagos que hará el emisor
 * con el monto neto que recibe al emitir el bono
 */
export function calcularTCEA(params: TCEAParams): TCEAResult {
  const {
    valorNominal,
    tasaAnual,
    frecuenciaPago,
    plazo,
    gracia,
    numPeriodosGracia,
    comisionEmisor,
    // comisionBonista se usa para el cálculo de TREA, no para TCEA
  } = params;

  // 1. Calcular el flujo de pagos del bono (método francés)
  const flujoFrances = calcularFlujoFrances({
    valorNominal,
    tasaAnual,
    frecuenciaPago,
    plazo,
    gracia,
    numPeriodosGracia,
  } as BonoParams);

  // 2. Calcular lo que realmente recibe el emisor al inicio
  // Recibe el valor nominal menos las comisiones que debe pagar
  const comisionEmisorMonto = (valorNominal * comisionEmisor) / 100;
  const ingresoInicialEmisor = valorNominal - comisionEmisorMonto;
  // 3. Crear el flujo del emisor
  const flujoEmisor = flujoFrances.map((periodo, index) => {
    let ingresoNeto = 0;
    const pago = periodo.cuota;

    // En el primer período, el emisor recibe el monto neto
    if (index === 0) {
      ingresoNeto = ingresoInicialEmisor;
    }

    return {
      periodo: periodo.periodo,
      ingresoNeto,
      pago,
      flujoNeto: ingresoNeto - pago,
    };
  });

  // 4. Calcular la TCEA usando el método de Newton-Raphson
  const tceaAnual = calcularTCEANewtonRaphson(flujoEmisor, frecuenciaPago);

  return {
    tcea: tceaAnual,
    flujoEmisor,
  };
}

/**
 * Método de Newton-Raphson para encontrar la TCEA
 * Busca la tasa que hace que el VPN de los flujos del emisor sea cero
 */
function calcularTCEANewtonRaphson(
  flujoEmisor: { periodo: number; flujoNeto: number }[],
  frecuenciaPago: number,
  precision: number = 1e-6,
  maxIteraciones: number = 100
): number {
  const tasa = 0.1; // Tasa inicial estimada (10% anual)
  let tasaPeriodo = tasa / frecuenciaPago;

  for (let i = 0; i < maxIteraciones; i++) {
    const { vpn, derivada } = calcularVPNyDerivada(flujoEmisor, tasaPeriodo);

    if (Math.abs(vpn) < precision) {
      // Convertir tasa periódica a anual
      return ((1 + tasaPeriodo) ** frecuenciaPago - 1) * 100;
    }

    if (Math.abs(derivada) < precision) {
      break; // Evitar división por cero
    }

    // Actualizar la tasa usando Newton-Raphson
    const nuevaTasaPeriodo = tasaPeriodo - vpn / derivada;
    tasaPeriodo = nuevaTasaPeriodo;
  }

  // Convertir a tasa anual
  return ((1 + tasaPeriodo) ** frecuenciaPago - 1) * 100;
}

/**
 * Calcula el VPN y su derivada para el método de Newton-Raphson
 */
function calcularVPNyDerivada(
  flujoEmisor: { periodo: number; flujoNeto: number }[],
  tasaPeriodo: number
): { vpn: number; derivada: number } {
  let vpn = 0;
  let derivada = 0;

  for (const flujo of flujoEmisor) {
    const factor = Math.pow(1 + tasaPeriodo, flujo.periodo);
    const flujoDescontado = flujo.flujoNeto / factor;

    vpn += flujoDescontado;

    // Derivada del VPN respecto a la tasa
    derivada -=
      (flujo.periodo * flujo.flujoNeto) / (factor * (1 + tasaPeriodo));
  }

  return { vpn, derivada };
}

/**
 * Función auxiliar para validar los parámetros de entrada
 */
export function validarParametrosTCEA(params: TCEAParams): string[] {
  const errores: string[] = [];

  if (params.valorNominal <= 0) {
    errores.push("El valor nominal debe ser mayor a cero");
  }

  if (params.tasaAnual < 0) {
    errores.push("La tasa anual no puede ser negativa");
  }

  if (params.frecuenciaPago <= 0) {
    errores.push("La frecuencia de pago debe ser mayor a cero");
  }

  if (params.plazo <= 0) {
    errores.push("El plazo debe ser mayor a cero");
  }

  if (params.comisionEmisor < 0) {
    errores.push("La comisión del emisor no puede ser negativa");
  }

  if (params.comisionBonista < 0) {
    errores.push("La comisión del bonista no puede ser negativa");
  }

  return errores;
}
