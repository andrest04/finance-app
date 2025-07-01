/**
 * Utilidades de validación comunes para bonos
 */

export interface ParametrosBonoBase {
  valorNominal: number;
  tasaAnual: number;
  frecuenciaPago: number;
  plazo: number;
  comisionEmisor: number;
  comisionBonista: number;
}

/**
 * Valida los parámetros básicos de un bono
 * @param params - Parámetros a validar
 * @returns Array de mensajes de error
 */
export function validarParametrosBono(params: ParametrosBonoBase): string[] {
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