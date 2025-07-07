import { useState, useMemo } from "react";
import { type GraciaPeriodoBono, type BonoFormData } from "./types";

interface PeriodoGraciaPreview {
  periodo: number;
  tipoGracia: "Sin Gracia" | "Parcial" | "Total";
}

export function useDynamicGracePeriods(
  watchedValues: BonoFormData,
  esGraciaDinamica: boolean
) {
  const [graciasPeriodo, setGraciasPeriodo] = useState<GraciaPeriodoBono[]>([
    { id: "1", desde: 1, hasta: 1, tipoGracia: "Sin Gracia" },
  ]);

  // Functions for dynamic grace periods
  const agregarGraciaPeriodo = () => {
    // Encontrar el siguiente rango disponible
    const plazo = parseInt(watchedValues.plazo || "0");
    const frecuencia = parseInt(watchedValues.frecuenciaPago || "1");
    const totalPeriodos = plazo > 0 && frecuencia > 0 ? plazo * frecuencia : 0;

    let siguienteDesde = 1;
    let siguienteHasta = 1;

    if (totalPeriodos > 0) {
      // Obtener todos los períodos ocupados
      const periodosOcupados = new Set<number>();
      graciasPeriodo.forEach((rango) => {
        for (let i = rango.desde; i <= rango.hasta; i++) {
          periodosOcupados.add(i);
        }
      });

      // Encontrar el primer período libre
      for (let i = 1; i <= totalPeriodos; i++) {
        if (!periodosOcupados.has(i)) {
          siguienteDesde = i;
          siguienteHasta = i;
          break;
        }
      }
    }

    const nuevaGracia: GraciaPeriodoBono = {
      id: Date.now().toString(),
      desde: siguienteDesde,
      hasta: siguienteHasta,
      tipoGracia: "Sin Gracia",
    };
    setGraciasPeriodo([...graciasPeriodo, nuevaGracia]);
  };

  const eliminarGraciaPeriodo = (id: string) => {
    setGraciasPeriodo(graciasPeriodo.filter((g) => g.id !== id));
  };

  const actualizarGraciaPeriodo = (
    id: string,
    campo: keyof Omit<GraciaPeriodoBono, "id">,
    valor: number | string
  ) => {
    setGraciasPeriodo(
      graciasPeriodo.map((g) => (g.id === id ? { ...g, [campo]: valor } : g))
    );
  };

  // Validar períodos de gracia contra total de períodos
  const validarGraciaContraTotalPeriodos = (
    gracia: GraciaPeriodoBono
  ): string | null => {
    const plazo = parseInt(watchedValues.plazo || "0");
    const frecuencia = parseInt(watchedValues.frecuenciaPago || "1");

    if (plazo > 0 && frecuencia > 0) {
      const totalPeriodos = plazo * frecuencia;

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

  // Generate preview of periods for dynamic grace
  const generarVistaGraciaPeriodos = useMemo((): PeriodoGraciaPreview[] => {
    if (
      !esGraciaDinamica ||
      !watchedValues.plazo ||
      !watchedValues.frecuenciaPago
    ) {
      return [];
    }

    const plazo = parseInt(watchedValues.plazo);
    const frecuencia = parseInt(watchedValues.frecuenciaPago);
    const totalPeriodos = plazo * frecuencia;

    const periodos = [];
    for (let i = 1; i <= totalPeriodos; i++) {
      // Find the grace type for this period
      let graciaAplicable: "Sin Gracia" | "Parcial" | "Total" = "Sin Gracia";
      for (const rango of graciasPeriodo) {
        if (i >= rango.desde && i <= rango.hasta) {
          graciaAplicable = rango.tipoGracia;
          break;
        }
      }

      periodos.push({
        periodo: i,
        tipoGracia: graciaAplicable,
      });
    }

    return periodos;
  }, [
    esGraciaDinamica,
    graciasPeriodo,
    watchedValues.plazo,
    watchedValues.frecuenciaPago,
  ]);

  return {
    graciasPeriodo,
    setGraciasPeriodo,
    agregarGraciaPeriodo,
    eliminarGraciaPeriodo,
    actualizarGraciaPeriodo,
    validarGraciaContraTotalPeriodos,
    generarVistaGraciaPeriodos,
  };
}
