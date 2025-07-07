import type { GraciaPeriodoBono, ValidationResult } from "./types";

// Función para validar períodos de gracia
export const validarPeriodosGracia = (
  periodos: number,
  totalPeriodos: number,
  tipoGracia?: string
): ValidationResult => {
  if (totalPeriodos === 0) {
    return {
      esValido: false,
      mensaje: "Complete plazo y frecuencia para validar períodos de gracia",
      tipo: "info",
    };
  }

  if (isNaN(periodos) || periodos < 0) {
    return {
      esValido: false,
      mensaje:
        "Los períodos de gracia deben ser un número válido y mayor o igual a 0",
      tipo: "error",
    };
  }

  if (tipoGracia === "Sin Gracia" && periodos > 0) {
    return {
      esValido: false,
      mensaje: "Los períodos de gracia deben ser 0 cuando no hay gracia",
      tipo: "error",
    };
  }

  if ((tipoGracia === "Parcial" || tipoGracia === "Total") && periodos === 0) {
    return {
      esValido: false,
      mensaje: `Debe especificar al menos 1 período de gracia para el tipo "${tipoGracia}"`,
      tipo: "error",
    };
  }

  if (periodos > totalPeriodos) {
    return {
      esValido: false,
      mensaje: `Los períodos de gracia (${periodos}) no pueden exceder el total de períodos (${totalPeriodos})`,
      tipo: "error",
    };
  }

  if (periodos > 0 && periodos <= totalPeriodos) {
    return {
      esValido: true,
      mensaje: `Períodos de gracia válidos: ${periodos} de ${totalPeriodos} períodos totales`,
      tipo: "success",
    };
  }

  return {
    esValido: true,
    mensaje: "",
    tipo: "info",
  };
};

// Validar períodos de gracia contra total de períodos
export const validarGraciaContraTotalPeriodos = (
  gracia: GraciaPeriodoBono,
  plazo: string,
  frecuenciaPago: string
): string | null => {
  const plazoNum = parseInt(plazo || "0");
  const frecuencia = parseInt(frecuenciaPago || "1");

  if (plazoNum > 0 && frecuencia > 0) {
    const totalPeriodos = plazoNum * frecuencia;

    if (gracia.desde > totalPeriodos) {
      return `Período 'desde' (${gracia.desde}) no puede exceder el total de períodos (${totalPeriodos})`;
    }

    if (gracia.hasta > totalPeriodos) {
      return `Período 'hasta' (${gracia.hasta}) no puede exceder el total de períodos (${totalPeriodos})`;
    }

    if (gracia.desde > gracia.hasta) {
      return `Período 'desde' (${gracia.desde}) no puede ser mayor que 'hasta' (${gracia.hasta})`;
    }
  }

  return null;
};

// Validar solapamientos entre rangos de gracia dinámica
export const validarSolapamientosGracia = (
  graciaActual: GraciaPeriodoBono,
  todosLosRangos: GraciaPeriodoBono[]
): string | null => {
  // Filtrar otros rangos (excluyendo el actual)
  const otrosRangos = todosLosRangos.filter((g) => g.id !== graciaActual.id);

  for (const otroRango of otrosRangos) {
    // Verificar si hay solapamiento
    const hayConflicto =
      (graciaActual.desde >= otroRango.desde &&
        graciaActual.desde <= otroRango.hasta) ||
      (graciaActual.hasta >= otroRango.desde &&
        graciaActual.hasta <= otroRango.hasta) ||
      (graciaActual.desde <= otroRango.desde &&
        graciaActual.hasta >= otroRango.hasta);

    if (hayConflicto) {
      return `El rango ${graciaActual.desde}-${graciaActual.hasta} se solapa con el rango ${otroRango.desde}-${otroRango.hasta}`;
    }
  }

  return null;
};

// Obtener valores mínimos y máximos permitidos para evitar solapamientos
export const obtenerLimitesInput = (
  graciaActual: GraciaPeriodoBono,
  campo: "desde" | "hasta",
  plazo: string,
  frecuenciaPago: string
) => {
  const plazoNum = parseInt(plazo || "0");
  const frecuencia = parseInt(frecuenciaPago || "1");
  const totalPeriodos =
    plazoNum > 0 && frecuencia > 0 ? plazoNum * frecuencia : 0;

  if (totalPeriodos === 0) return { min: 1, max: undefined };

  if (campo === "desde") {
    // Para "desde": no puede empezar en un período ya ocupado
    const min = 1;
    let max = totalPeriodos;

    // Si hay un "hasta" definido, el "desde" no puede ser mayor
    if (graciaActual.hasta > 0) {
      max = Math.min(max, graciaActual.hasta);
    }

    return { min, max };
  } else {
    // Para "hasta": debe ser >= desde
    const min = Math.max(1, graciaActual.desde || 1);
    const max = totalPeriodos;

    return { min, max };
  }
};
