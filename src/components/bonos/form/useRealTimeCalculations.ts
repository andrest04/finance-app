import { useMemo } from "react";
import {
  BonoData,
  calcularTCEABono,
  calcularTREABono,
} from "@/lib/bono/bonoUtils";
import {
  calcularFlujoFrances,
  calcularFlujoFrancesDinamico,
} from "@/lib/calculations/francesMetod";
import {
  calcularDuracion,
  calcularConvexidad,
  type FlujoBono,
} from "@/lib/calculations/indicadoresBono";
import {
  analizarBonoSemestral,
  type BonoSemestralParams,
} from "@/lib/calculations/bonoSemestralAnalisis";
import {
  type BonoFormData,
  type CalculatedMetrics,
  type GraciaPeriodoBono,
} from "./types";

export function useRealTimeCalculations(
  watchedValues: BonoFormData,
  firebaseUser: { uid: string } | null,
  esGraciaDinamica: boolean,
  graciasPeriodo: GraciaPeriodoBono[]
): CalculatedMetrics | null {
  return useMemo((): CalculatedMetrics | null => {
    const {
      valorNominal,
      tasaAnual,
      frecuenciaPago,
      plazo,
      tipoGracia,
      nGracia,
      comisionEmisor,
      comisionBonista,
    } = watchedValues;

    if (!valorNominal || !tasaAnual || !frecuenciaPago || !plazo) {
      return null;
    }

    try {
      const bonoData: BonoData = {
        nombre: watchedValues.nombre || "Bono Temporal",
        valorNominal: parseFloat(valorNominal),
        moneda: watchedValues.moneda || "PEN",
        tipoTasa: watchedValues.tipoTasa || "Efectiva",
        tasaAnual: parseFloat(tasaAnual),
        frecuenciaPago: parseInt(frecuenciaPago),
        plazo: parseInt(plazo),
        tipoGracia: tipoGracia || "Sin Gracia",
        nGracia: parseInt(nGracia || "0"),
        fechaEmision:
          watchedValues.fechaEmision || new Date().toISOString().split("T")[0],
        comisionEmisor: parseFloat(comisionEmisor || "0"),
        comisionBonista: parseFloat(comisionBonista || "0"),
        tasaMercadoCOK: parseFloat(watchedValues.tasaMercadoCOK || "0"),
        tasaMercado: 0, // Will be calculated
        userId: firebaseUser?.uid || "",
        emisorNombre: "",
      };

      // Calculate TCEA and TREA
      const tcea = calcularTCEABono(bonoData);
      const trea = calcularTREABono(bonoData);

      // Calculate TES (Tasa Efectiva Semestral) if frequency is semestral
      let tes: number | undefined;
      let analisisSemestral;

      if (parseInt(frecuenciaPago) === 2) {
        // For semestral frequency, calculate TES from annual rate
        // TES = (1 + TEA)^(1/2) - 1
        const tasaAnualDecimal = parseFloat(tasaAnual) / 100;
        tes = (Math.pow(1 + tasaAnualDecimal, 1 / 2) - 1) * 100;

        // Realizar análisis completo para bonos semestrales
        try {
          const paramsAnalisis: BonoSemestralParams = {
            valorNominal: parseFloat(valorNominal),
            tea: parseFloat(tasaAnual),
            plazo: parseInt(plazo),
            tasaMercadoTEA: parseFloat(
              watchedValues.tasaMercadoCOK || tasaAnual
            ), // Usar COK o tasa del bono como referencia
            comisionEmisor: parseFloat(comisionEmisor || "0"),
            comisionBonista: parseFloat(comisionBonista || "0"),
            comisionCavali: 0.06, // Comisión típica de CAVALI
          };

          const resultadoAnalisis = analizarBonoSemestral(paramsAnalisis);

          analisisSemestral = {
            tesMercado: resultadoAnalisis.tesMercado,
            cuponSemestral: resultadoAnalisis.cuponSemestral,
            numeroSemestres: resultadoAnalisis.numeroSemestres,
            precio: resultadoAnalisis.precio,
            precioMaximoMercado: resultadoAnalisis.precioMaximoMercado,
            montoNetoRecibidoEmisor: resultadoAnalisis.montoNetoRecibidoEmisor,
            inversionTotalInversionista:
              resultadoAnalisis.inversionTotalInversionista,
            tceaEmisor: resultadoAnalisis.tceaEmisor,
            treaInversionista: resultadoAnalisis.treaInversionista,
            treaSinSAB: resultadoAnalisis.treaSinSAB,
            duracionMacaulay: resultadoAnalisis.duracionMacaulay,
            duracionModificada: resultadoAnalisis.duracionModificada,
            convexidadSemestral: resultadoAnalisis.convexidad,
            esPremium: resultadoAnalisis.esPremium,
            esDescuento: resultadoAnalisis.esDescuento,
            esParidad: resultadoAnalisis.esParidad,
          };
        } catch (error) {
          console.warn("Error en análisis semestral:", error);
          // Continuar con cálculos tradicionales si falla el análisis semestral
        }
      }

      // Calculate cash flows using French method
      const mapGracia = (tipo: string): "Ninguno" | "Total" | "Parcial" => {
        if (tipo === "Sin Gracia") return "Ninguno";
        if (tipo === "Total") return "Total";
        if (tipo === "Parcial") return "Parcial";
        return "Ninguno";
      };

      let flujos;
      // Check if dynamic grace is enabled and has grace periods configured
      if (
        esGraciaDinamica &&
        graciasPeriodo.length > 0 &&
        graciasPeriodo.some((g) => g.desde > 0 && g.hasta > 0)
      ) {
        // Use dynamic grace calculation
        flujos = calcularFlujoFrancesDinamico({
          valorNominal: bonoData.valorNominal,
          tasaAnual: bonoData.tasaAnual,
          frecuenciaPago: bonoData.frecuenciaPago,
          plazo: bonoData.plazo,
          graciasPorPeriodo: graciasPeriodo.map((g) => ({
            desde: g.desde,
            hasta: g.hasta,
            tipoGracia: g.tipoGracia,
          })),
        });
      } else {
        // Use traditional static grace calculation
        flujos = calcularFlujoFrances({
          valorNominal: bonoData.valorNominal,
          tasaAnual: bonoData.tasaAnual,
          frecuenciaPago: bonoData.frecuenciaPago,
          plazo: bonoData.plazo,
          gracia: mapGracia(bonoData.tipoGracia),
          numPeriodosGracia: bonoData.nGracia || 0,
        });
      }

      const totalPeriodos = flujos.length;
      const cuotaConstante = flujos.length > 0 ? flujos[0].cuota : 0;
      const totalIntereses = flujos.reduce((sum, f) => sum + f.interes, 0);
      const totalPagado = flujos.reduce((sum, f) => sum + f.cuota, 0);

      // Calculate duration and convexity using actual financial formulas
      const tasaPeriodo = bonoData.tasaAnual / 100 / bonoData.frecuenciaPago;

      // Convert cash flows to the format expected by indicadoresBono functions
      const flujosBono: FlujoBono[] = flujos.map((f) => ({
        periodo: f.periodo,
        flujo: f.cuota,
      }));

      // Calculate actual duration and convexity using proper financial formulas
      const duracion = calcularDuracion(flujosBono, tasaPeriodo);
      const convexidad = calcularConvexidad(flujosBono, tasaPeriodo);

      return {
        tcea,
        trea,
        tes,
        totalPeriodos,
        cuotaConstante,
        totalIntereses,
        totalPagado,
        duracion,
        convexidad,
        analisisSemestral,
      };
    } catch (error) {
      console.error("Error calculating metrics:", error);
      return null;
    }
  }, [watchedValues, firebaseUser, esGraciaDinamica, graciasPeriodo]);
}
