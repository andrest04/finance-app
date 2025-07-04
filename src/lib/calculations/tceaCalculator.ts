// Cálculo de TCEA (Tasa de Coste Efectivo Anual) desde el punto de vista del emisor
// La TCEA considera todos los costos que tiene el emisor al emitir el bono

import { calcularFlujoFrances, type BonoParams } from "./francesMetod";
import { validarParametrosBono } from "../bono/validationUtils";
import { calcularTasaNewtonRaphson } from "./newtonRaphsonUtils";

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

export interface TREAParams {
  valorNominal: number;
  tasaAnual: number; // Tasa de interés del bono
  frecuenciaPago: number;
  plazo: number;
  gracia: "Ninguno" | "Total" | "Parcial";
  numPeriodosGracia: number;
  comisionEmisor: number; // Comisión que paga el emisor (%)
  comisionBonista: number; // Comisión que paga el bonista (%)
}

export interface TREAResult {
  trea: number; // TREA anualizada (%)
  flujoInversionista: {
    periodo: number;
    inversion: number; // Lo que paga el inversionista
    ingreso: number; // Lo que recibe el inversionista
    flujoNeto: number; // Ingreso - Inversión
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
  const ingresoInicialEmisor = valorNominal - comisionEmisorMonto;  // 3. Crear el flujo del emisor
  // Período 0: El emisor recibe el monto neto
  const flujoEmisor = [
    {
      periodo: 0,
      ingresoNeto: ingresoInicialEmisor,
      pago: 0,
      flujoNeto: ingresoInicialEmisor,
    },
    // Períodos 1 en adelante: El emisor paga las cuotas
    ...flujoFrances.map((periodo) => ({
      periodo: periodo.periodo,
      ingresoNeto: 0,
      pago: periodo.cuota,
      flujoNeto: -periodo.cuota,
    })),
  ];

  // 4. Calcular la TCEA usando el método de Newton-Raphson
  const tceaAnual = calcularTasaNewtonRaphson(flujoEmisor, frecuenciaPago);

  return {
    tcea: tceaAnual,
    flujoEmisor,
  };
}

/**
 * Función auxiliar para validar los parámetros de entrada de TCEA
 */
export function validarParametrosTCEA(params: TCEAParams): string[] {
  return validarParametrosBono(params);
}

/**
 * Calcula la TREA desde el punto de vista del inversionista/bonista
 * La TREA es la tasa que iguala el valor presente de los ingresos que recibirá el inversionista
 * con el monto que paga por el bono (incluyendo comisiones)
 */
export function calcularTREA(params: TREAParams): TREAResult {
  const {
    valorNominal,
    tasaAnual,
    frecuenciaPago,
    plazo,
    gracia,
    numPeriodosGracia,
    comisionBonista,
    // comisionEmisor no afecta al inversionista
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

  // 2. Calcular lo que realmente paga el inversionista al inicio
  // Paga el valor nominal más las comisiones del bonista
  const comisionBonistaMonto = (valorNominal * comisionBonista) / 100;
  const inversionInicialBonista = valorNominal + comisionBonistaMonto;
  // 3. Crear el flujo del inversionista
  // Período 0: El inversionista realiza la inversión inicial
  const flujoInversionista = [
    {
      periodo: 0,
      inversion: inversionInicialBonista,
      ingreso: 0,
      flujoNeto: -inversionInicialBonista,
    },
    // Períodos 1 en adelante: El inversionista recibe las cuotas
    ...flujoFrances.map((periodo) => ({
      periodo: periodo.periodo,
      inversion: 0,
      ingreso: periodo.cuota,
      flujoNeto: periodo.cuota,
    })),
  ];

  // 4. Calcular la TREA usando el método de Newton-Raphson
  const treaAnual = calcularTasaNewtonRaphson(
    flujoInversionista,
    frecuenciaPago
  );

  return {
    trea: treaAnual,
    flujoInversionista,
  };
}

/**
 * Función auxiliar para validar los parámetros de entrada de TREA
 */
export function validarParametrosTREA(params: TREAParams): string[] {
  return validarParametrosBono(params);
}
