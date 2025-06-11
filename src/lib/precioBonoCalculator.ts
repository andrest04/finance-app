/**
 * Cálculo del Precio del Bono (Valor Actual del Bono)
 *
 * El precio del bono es el valor presente de todos los flujos de caja futuros
 * (cupones y amortización) descontados a una tasa de mercado adecuada.
 */

import { calcularFlujoFrances, type BonoParams } from "./francesMetod";
import type { BonoData } from "./bonoUtils";

export interface PrecioBonoParams {
  valorNominal: number;
  tasaAnual: number; // Tasa cupón del bono
  frecuenciaPago: number;
  plazo: number;
  gracia: "Ninguno" | "Total" | "Parcial";
  numPeriodosGracia: number;
  tasaDescuento: number; // Tasa de mercado para descontar
}

export interface PrecioBonoResult {
  precio: number; // Precio actual del bono
  valorNominal: number; // Valor facial
  prima: number; // Prima o descuento (precio - valor nominal)
  porcentajePrima: number; // Prima como porcentaje del valor nominal
  ytm: number; // Yield to Maturity (igual a tasa de descuento)
  duracion: number; // Duración de Macaulay
  duracionModificada: number; // Duración modificada
  convexidad: number; // Convexidad
  esObligacionPremium: boolean; // true si precio > valor nominal
  esObligacionDescuento: boolean; // true si precio < valor nominal
}

/**
 * Calcula el precio del bono descontando todos los flujos futuros
 */
export function calcularPrecioBono(params: PrecioBonoParams): PrecioBonoResult {
  const {
    valorNominal,
    tasaAnual,
    frecuenciaPago,
    plazo,
    gracia,
    numPeriodosGracia,
    tasaDescuento,
  } = params;

  // 1. Calcular flujos de caja del bono
  const flujos = calcularFlujoFrances({
    valorNominal,
    tasaAnual,
    frecuenciaPago,
    plazo,
    gracia,
    numPeriodosGracia,
  } as BonoParams);

  // 2. Tasa de descuento por período
  const tasaDescuentoPeriodo = tasaDescuento / 100 / frecuenciaPago;

  // 3. Calcular precio como valor presente de todos los flujos
  let precio = 0;
  let sumaPVt = 0; // Para duración
  let sumaConvexidad = 0; // Para convexidad

  flujos.forEach((flujo) => {
    const valorPresente =
      flujo.cuota / Math.pow(1 + tasaDescuentoPeriodo, flujo.periodo);
    precio += valorPresente;

    // Para duración de Macaulay
    sumaPVt += flujo.periodo * valorPresente;

    // Para convexidad
    sumaConvexidad += valorPresente * flujo.periodo * (flujo.periodo + 1);
  });

  // 4. Calcular indicadores de riesgo
  const duracion = precio === 0 ? 0 : sumaPVt / precio;
  const duracionModificada = duracion / (1 + tasaDescuentoPeriodo);
  const convexidad =
    precio === 0
      ? 0
      : sumaConvexidad / (precio * Math.pow(1 + tasaDescuentoPeriodo, 2));

  // 5. Calcular prima/descuento
  const prima = precio - valorNominal;
  const porcentajePrima = valorNominal === 0 ? 0 : (prima / valorNominal) * 100;

  // 6. Determinar tipo de obligación
  const esObligacionPremium = precio > valorNominal;
  const esObligacionDescuento = precio < valorNominal;

  return {
    precio,
    valorNominal,
    prima,
    porcentajePrima,
    ytm: tasaDescuento,
    duracion,
    duracionModificada,
    convexidad,
    esObligacionPremium,
    esObligacionDescuento,
  };
}

/**
 * Wrapper para calcular precio desde un objeto BonoData
 */
export function calcularPrecioBonoDesdeBono(
  bono: BonoData,
  tasaDescuento?: number
): PrecioBonoResult {
  const mapGracia = (tipo: string): "Ninguno" | "Total" | "Parcial" => {
    if (tipo === "Sin Gracia" || tipo === "Ninguno") return "Ninguno";
    if (tipo === "Total") return "Total";
    if (tipo === "Parcial") return "Parcial";
    return "Ninguno";
  };

  return calcularPrecioBono({
    valorNominal: bono.valorNominal,
    tasaAnual: bono.tasaAnual,
    frecuenciaPago: bono.frecuenciaPago,
    plazo: bono.plazo,
    gracia: mapGracia(bono.tipoGracia),
    numPeriodosGracia: bono.nGracia || 0,
    tasaDescuento: tasaDescuento || bono.tasaMercado || bono.tasaAnual,
  });
}

/**
 * Calcula el rendimiento al vencimiento (YTM) dado un precio objetivo
 * Usa método de Newton-Raphson para encontrar la tasa que iguala el precio
 */
export function calcularYTM(
  params: Omit<PrecioBonoParams, "tasaDescuento">,
  precioObjetivo: number,
  precision: number = 0.0001,
  maxIteraciones: number = 100
): number {
  let tasa = params.tasaAnual / 100; // Estimación inicial

  for (let i = 0; i < maxIteraciones; i++) {
    const resultado = calcularPrecioBono({
      ...params,
      tasaDescuento: tasa * 100,
    });

    const diferencia = resultado.precio - precioObjetivo;

    if (Math.abs(diferencia) < precision) {
      return tasa * 100; // Convertir a porcentaje
    }

    // Calcular derivada (sensibilidad del precio a la tasa)
    const deltaSubida = calcularPrecioBono({
      ...params,
      tasaDescuento: (tasa + 0.0001) * 100,
    });

    const derivada = (deltaSubida.precio - resultado.precio) / 0.0001;

    if (Math.abs(derivada) < 1e-10) {
      break; // Evitar división por cero
    }

    // Newton-Raphson: nueva_tasa = tasa_actual - f(x)/f'(x)
    tasa = tasa - diferencia / derivada;

    // Asegurar que la tasa sea positiva
    tasa = Math.max(0.0001, tasa);
  }

  return tasa * 100; // Convertir a porcentaje
}

/**
 * Funciones de utilidad para interpretación de resultados
 */
export function interpretarPrecioBono(resultado: PrecioBonoResult): {
  tipo: string;
  descripcion: string;
  recomendacion: string;
} {
  const { esObligacionPremium, esObligacionDescuento, porcentajePrima } =
    resultado;

  if (esObligacionPremium) {
    return {
      tipo: "Obligación Premium",
      descripcion: `El bono cotiza ${Math.abs(porcentajePrima).toFixed(
        2
      )}% por encima de su valor nominal`,
      recomendacion:
        "El bono ofrece una tasa cupón mayor que las tasas de mercado actuales",
    };
  } else if (esObligacionDescuento) {
    return {
      tipo: "Obligación con Descuento",
      descripcion: `El bono cotiza ${Math.abs(porcentajePrima).toFixed(
        2
      )}% por debajo de su valor nominal`,
      recomendacion:
        "El bono ofrece una tasa cupón menor que las tasas de mercado actuales",
    };
  } else {
    return {
      tipo: "Obligación a la Par",
      descripcion: "El bono cotiza a su valor nominal",
      recomendacion: "La tasa cupón es igual a la tasa de mercado",
    };
  }
}
