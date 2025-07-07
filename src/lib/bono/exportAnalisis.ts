/**
 * Utilidades para exportar análisis de bonos semestrales
 * Permite exportar todos los resultados calculados en diferentes formatos
 */

import type {
  CalculatedMetrics,
  BonoFormData,
} from "@/components/bonos/form/types";

export interface DatosExportacion {
  informacionGeneral: {
    nombreBono: string;
    fechaAnalisis: string;
    valorNominal: number;
    moneda: string;
    tasaAnual: number;
    frecuenciaPago: number;
    plazoAnios: number;
    tipoGracia: string;
    comisionEmisor: number;
    comisionBonista: number;
    tasaMercadoCOK: number;
  };
  resultadosTradicionales: {
    tcea: number;
    trea: number;
    tes?: number;
    totalPeriodos: number;
    cuotaConstante: number;
    totalIntereses: number;
    totalPagado: number;
    duracion: number;
    convexidad: number;
  };
  analisisSemestral?: {
    tasas: {
      tesBono: number;
      tesMercado: number;
    };
    flujos: {
      cuponSemestral: number;
      numeroSemestres: number;
    };
    precios: {
      precioActual: number;
      precioMaximoMercado: number;
      clasificacion: string;
    };
    costosFlujosNetos: {
      montoNetoRecibidoEmisor: number;
      inversionTotalInversionista: number;
    };
    tasasRendimiento: {
      tceaEmisor: number;
      treaInversionista: number;
      treaSinSAB: number;
    };
    indicadoresRiesgo: {
      duracionMacaulay: number;
      duracionModificada: number;
      convexidadSemestral: number;
    };
  };
}

/**
 * Convierte los datos del formulario y métricas calculadas a formato de exportación
 */
export function prepararDatosExportacion(
  datosFormulario: BonoFormData,
  metricas: CalculatedMetrics
): DatosExportacion {
  const datos: DatosExportacion = {
    informacionGeneral: {
      nombreBono: datosFormulario.nombre,
      fechaAnalisis: new Date().toLocaleString("es-PE"),
      valorNominal: parseFloat(datosFormulario.valorNominal),
      moneda: datosFormulario.moneda,
      tasaAnual: parseFloat(datosFormulario.tasaAnual),
      frecuenciaPago: parseInt(datosFormulario.frecuenciaPago),
      plazoAnios: parseInt(datosFormulario.plazo),
      tipoGracia: datosFormulario.tipoGracia,
      comisionEmisor: parseFloat(datosFormulario.comisionEmisor || "0"),
      comisionBonista: parseFloat(datosFormulario.comisionBonista || "0"),
      tasaMercadoCOK: parseFloat(datosFormulario.tasaMercadoCOK || "0"),
    },
    resultadosTradicionales: {
      tcea: metricas.tcea,
      trea: metricas.trea,
      tes: metricas.tes,
      totalPeriodos: metricas.totalPeriodos,
      cuotaConstante: metricas.cuotaConstante,
      totalIntereses: metricas.totalIntereses,
      totalPagado: metricas.totalPagado,
      duracion: metricas.duracion,
      convexidad: metricas.convexidad,
    },
  };

  // Agregar análisis semestral si está disponible
  if (metricas.analisisSemestral) {
    const as = metricas.analisisSemestral;
    datos.analisisSemestral = {
      tasas: {
        tesBono: metricas.tes || 0,
        tesMercado: as.tesMercado,
      },
      flujos: {
        cuponSemestral: as.cuponSemestral,
        numeroSemestres: as.numeroSemestres,
      },
      precios: {
        precioActual: as.precio,
        precioMaximoMercado: as.precioMaximoMercado,
        clasificacion: as.esPremium
          ? "Premium"
          : as.esDescuento
          ? "Descuento"
          : "Paridad",
      },
      costosFlujosNetos: {
        montoNetoRecibidoEmisor: as.montoNetoRecibidoEmisor,
        inversionTotalInversionista: as.inversionTotalInversionista,
      },
      tasasRendimiento: {
        tceaEmisor: as.tceaEmisor,
        treaInversionista: as.treaInversionista,
        treaSinSAB: as.treaSinSAB,
      },
      indicadoresRiesgo: {
        duracionMacaulay: as.duracionMacaulay,
        duracionModificada: as.duracionModificada,
        convexidadSemestral: as.convexidadSemestral,
      },
    };
  }

  return datos;
}

/**
 * Exporta los datos a formato JSON
 */
export function exportarAJSON(datos: DatosExportacion): void {
  const jsonString = JSON.stringify(datos, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `analisis_bono_${datos.informacionGeneral.nombreBono.replace(
    /\s+/g,
    "_"
  )}_${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporta los datos a formato CSV
 */
export function exportarACSV(datos: DatosExportacion): void {
  const filas: string[] = [];

  // Encabezado
  filas.push("ANÁLISIS DE BONO CORPORATIVO");
  filas.push(`Fecha de Análisis: ${datos.informacionGeneral.fechaAnalisis}`);
  filas.push("");

  // Información General
  filas.push("INFORMACIÓN GENERAL");
  filas.push(`Nombre del Bono,${datos.informacionGeneral.nombreBono}`);
  filas.push(
    `Valor Nominal,${datos.informacionGeneral.valorNominal} ${datos.informacionGeneral.moneda}`
  );
  filas.push(`Tasa Anual,${datos.informacionGeneral.tasaAnual}%`);
  filas.push(
    `Frecuencia de Pago,${datos.informacionGeneral.frecuenciaPago} pagos/año`
  );
  filas.push(`Plazo,${datos.informacionGeneral.plazoAnios} años`);
  filas.push(`Tipo de Gracia,${datos.informacionGeneral.tipoGracia}`);
  filas.push(`Comisión Emisor,${datos.informacionGeneral.comisionEmisor}%`);
  filas.push(`Comisión Bonista,${datos.informacionGeneral.comisionBonista}%`);
  filas.push(
    `COK (Tasa de Mercado),${datos.informacionGeneral.tasaMercadoCOK}%`
  );
  filas.push("");

  // Resultados Tradicionales
  filas.push("RESULTADOS TRADICIONALES");
  filas.push(`TCEA,${datos.resultadosTradicionales.tcea.toFixed(4)}%`);
  filas.push(`TREA,${datos.resultadosTradicionales.trea.toFixed(4)}%`);
  if (datos.resultadosTradicionales.tes) {
    filas.push(`TES,${datos.resultadosTradicionales.tes.toFixed(4)}%`);
  }
  filas.push(`Total Períodos,${datos.resultadosTradicionales.totalPeriodos}`);
  filas.push(
    `Cuota Constante,${datos.resultadosTradicionales.cuotaConstante.toFixed(
      2
    )} ${datos.informacionGeneral.moneda}`
  );
  filas.push(
    `Total Intereses,${datos.resultadosTradicionales.totalIntereses.toFixed(
      2
    )} ${datos.informacionGeneral.moneda}`
  );
  filas.push(
    `Total a Pagar,${datos.resultadosTradicionales.totalPagado.toFixed(2)} ${
      datos.informacionGeneral.moneda
    }`
  );
  filas.push(`Duración,${datos.resultadosTradicionales.duracion.toFixed(4)}`);
  filas.push(
    `Convexidad,${datos.resultadosTradicionales.convexidad.toFixed(4)}`
  );
  filas.push("");

  // Análisis Semestral (si está disponible)
  if (datos.analisisSemestral) {
    const as = datos.analisisSemestral;
    filas.push("ANÁLISIS SEMESTRAL ESPECÍFICO");
    filas.push("");

    filas.push("Tasas Convertidas");
    filas.push(`TES Bono,${as.tasas.tesBono.toFixed(4)}%`);
    filas.push(`TES Mercado,${as.tasas.tesMercado.toFixed(4)}%`);
    filas.push("");

    filas.push("Flujos del Bono");
    filas.push(
      `Cupón Semestral,${as.flujos.cuponSemestral.toFixed(2)} ${
        datos.informacionGeneral.moneda
      }`
    );
    filas.push(`Número de Semestres,${as.flujos.numeroSemestres}`);
    filas.push("");

    filas.push("Precios del Bono");
    filas.push(
      `Precio Actual,${as.precios.precioActual.toFixed(2)} ${
        datos.informacionGeneral.moneda
      }`
    );
    filas.push(
      `Precio Máximo (COK),${as.precios.precioMaximoMercado.toFixed(2)} ${
        datos.informacionGeneral.moneda
      }`
    );
    filas.push(`Clasificación,${as.precios.clasificacion}`);
    filas.push("");

    filas.push("Costos y Flujos Netos");
    filas.push(
      `Monto Neto Recibido (Emisor),${as.costosFlujosNetos.montoNetoRecibidoEmisor.toFixed(
        2
      )} ${datos.informacionGeneral.moneda}`
    );
    filas.push(
      `Inversión Total (Inversionista),${as.costosFlujosNetos.inversionTotalInversionista.toFixed(
        2
      )} ${datos.informacionGeneral.moneda}`
    );
    filas.push("");

    filas.push("Tasas de Rendimiento");
    filas.push(`TCEA Emisor,${as.tasasRendimiento.tceaEmisor.toFixed(4)}%`);
    filas.push(
      `TREA Inversionista,${as.tasasRendimiento.treaInversionista.toFixed(4)}%`
    );
    filas.push(`TREA sin SAB,${as.tasasRendimiento.treaSinSAB.toFixed(4)}%`);
    filas.push("");

    filas.push("Indicadores de Riesgo");
    filas.push(
      `Duración Macaulay,${as.indicadoresRiesgo.duracionMacaulay.toFixed(
        4
      )} años`
    );
    filas.push(
      `Duración Modificada,${as.indicadoresRiesgo.duracionModificada.toFixed(
        4
      )}`
    );
    filas.push(
      `Convexidad Semestral,${as.indicadoresRiesgo.convexidadSemestral.toFixed(
        4
      )}`
    );
  }

  const csvContent = filas.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `analisis_bono_${datos.informacionGeneral.nombreBono.replace(
    /\s+/g,
    "_"
  )}_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Genera un reporte en texto plano con formato legible
 */
export function generarReporteTexto(datos: DatosExportacion): string {
  const lineas: string[] = [];

  lineas.push(
    "═══════════════════════════════════════════════════════════════"
  );
  lineas.push("                    ANÁLISIS DE BONO CORPORATIVO");
  lineas.push(
    "═══════════════════════════════════════════════════════════════"
  );
  lineas.push(`Fecha de Análisis: ${datos.informacionGeneral.fechaAnalisis}`);
  lineas.push("");

  // Información General
  lineas.push("─────────────────────────────────────────────────────────────");
  lineas.push("                      INFORMACIÓN GENERAL");
  lineas.push("─────────────────────────────────────────────────────────────");
  lineas.push(`Nombre del Bono       : ${datos.informacionGeneral.nombreBono}`);
  lineas.push(
    `Valor Nominal         : ${datos.informacionGeneral.valorNominal.toLocaleString(
      "es-PE"
    )} ${datos.informacionGeneral.moneda}`
  );
  lineas.push(`Tasa Anual            : ${datos.informacionGeneral.tasaAnual}%`);
  lineas.push(
    `Frecuencia de Pago    : ${datos.informacionGeneral.frecuenciaPago} pagos/año`
  );
  lineas.push(
    `Plazo                 : ${datos.informacionGeneral.plazoAnios} años`
  );
  lineas.push(`Tipo de Gracia        : ${datos.informacionGeneral.tipoGracia}`);
  lineas.push(
    `Comisión Emisor       : ${datos.informacionGeneral.comisionEmisor}%`
  );
  lineas.push(
    `Comisión Bonista      : ${datos.informacionGeneral.comisionBonista}%`
  );
  lineas.push(
    `COK (Tasa de Mercado) : ${datos.informacionGeneral.tasaMercadoCOK}%`
  );
  lineas.push("");

  // Resultados Tradicionales
  lineas.push("─────────────────────────────────────────────────────────────");
  lineas.push("                    RESULTADOS TRADICIONALES");
  lineas.push("─────────────────────────────────────────────────────────────");
  lineas.push(
    `TCEA                  : ${datos.resultadosTradicionales.tcea.toFixed(4)}%`
  );
  lineas.push(
    `TREA                  : ${datos.resultadosTradicionales.trea.toFixed(4)}%`
  );
  if (datos.resultadosTradicionales.tes) {
    lineas.push(
      `TES                   : ${datos.resultadosTradicionales.tes.toFixed(4)}%`
    );
  }
  lineas.push(
    `Total Períodos        : ${datos.resultadosTradicionales.totalPeriodos}`
  );
  lineas.push(
    `Cuota Constante       : ${datos.resultadosTradicionales.cuotaConstante.toLocaleString(
      "es-PE",
      { minimumFractionDigits: 2 }
    )} ${datos.informacionGeneral.moneda}`
  );
  lineas.push(
    `Total Intereses       : ${datos.resultadosTradicionales.totalIntereses.toLocaleString(
      "es-PE",
      { minimumFractionDigits: 2 }
    )} ${datos.informacionGeneral.moneda}`
  );
  lineas.push(
    `Total a Pagar         : ${datos.resultadosTradicionales.totalPagado.toLocaleString(
      "es-PE",
      { minimumFractionDigits: 2 }
    )} ${datos.informacionGeneral.moneda}`
  );
  lineas.push(
    `Duración              : ${datos.resultadosTradicionales.duracion.toFixed(
      4
    )}`
  );
  lineas.push(
    `Convexidad            : ${datos.resultadosTradicionales.convexidad.toFixed(
      4
    )}`
  );
  lineas.push("");

  // Análisis Semestral (si está disponible)
  if (datos.analisisSemestral) {
    const as = datos.analisisSemestral;
    lineas.push(
      "─────────────────────────────────────────────────────────────"
    );
    lineas.push("                   ANÁLISIS SEMESTRAL ESPECÍFICO");
    lineas.push(
      "─────────────────────────────────────────────────────────────"
    );
    lineas.push("");

    lineas.push("📊 TASAS CONVERTIDAS:");
    lineas.push(`   TES Bono           : ${as.tasas.tesBono.toFixed(4)}%`);
    lineas.push(`   TES Mercado        : ${as.tasas.tesMercado.toFixed(4)}%`);
    lineas.push("");

    lineas.push("💰 FLUJOS DEL BONO:");
    lineas.push(
      `   Cupón Semestral    : ${as.flujos.cuponSemestral.toLocaleString(
        "es-PE",
        { minimumFractionDigits: 2 }
      )} ${datos.informacionGeneral.moneda}`
    );
    lineas.push(`   Número Semestres   : ${as.flujos.numeroSemestres}`);
    lineas.push("");

    lineas.push("💵 PRECIOS DEL BONO:");
    lineas.push(
      `   Precio Actual      : ${as.precios.precioActual.toLocaleString(
        "es-PE",
        { minimumFractionDigits: 2 }
      )} ${datos.informacionGeneral.moneda}`
    );
    lineas.push(
      `   Precio Máximo (COK): ${as.precios.precioMaximoMercado.toLocaleString(
        "es-PE",
        { minimumFractionDigits: 2 }
      )} ${datos.informacionGeneral.moneda}`
    );
    lineas.push(`   Clasificación      : ${as.precios.clasificacion}`);
    lineas.push("");

    lineas.push("🏦 COSTOS Y FLUJOS NETOS:");
    lineas.push(
      `   Neto Emisor        : ${as.costosFlujosNetos.montoNetoRecibidoEmisor.toLocaleString(
        "es-PE",
        { minimumFractionDigits: 2 }
      )} ${datos.informacionGeneral.moneda}`
    );
    lineas.push(
      `   Inversión Total    : ${as.costosFlujosNetos.inversionTotalInversionista.toLocaleString(
        "es-PE",
        { minimumFractionDigits: 2 }
      )} ${datos.informacionGeneral.moneda}`
    );
    lineas.push("");

    lineas.push("📈 TASAS DE RENDIMIENTO:");
    lineas.push(
      `   TCEA Emisor        : ${as.tasasRendimiento.tceaEmisor.toFixed(4)}%`
    );
    lineas.push(
      `   TREA Inversionista : ${as.tasasRendimiento.treaInversionista.toFixed(
        4
      )}%`
    );
    lineas.push(
      `   TREA sin SAB       : ${as.tasasRendimiento.treaSinSAB.toFixed(4)}%`
    );
    lineas.push("");

    lineas.push("⚠️  INDICADORES DE RIESGO:");
    lineas.push(
      `   Duración Macaulay  : ${as.indicadoresRiesgo.duracionMacaulay.toFixed(
        4
      )} años`
    );
    lineas.push(
      `   Duración Modificada: ${as.indicadoresRiesgo.duracionModificada.toFixed(
        4
      )}`
    );
    lineas.push(
      `   Convexidad         : ${as.indicadoresRiesgo.convexidadSemestral.toFixed(
        4
      )}`
    );
  }

  lineas.push("");
  lineas.push(
    "═══════════════════════════════════════════════════════════════"
  );
  lineas.push("              Generado por Sistema de Análisis de Bonos");
  lineas.push(
    "═══════════════════════════════════════════════════════════════"
  );

  return lineas.join("\n");
}

/**
 * Exporta el reporte en formato de texto
 */
export function exportarReporteTexto(datos: DatosExportacion): void {
  const contenido = generarReporteTexto(datos);
  const blob = new Blob([contenido], { type: "text/plain;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `reporte_analisis_${datos.informacionGeneral.nombreBono.replace(
    /\s+/g,
    "_"
  )}_${new Date().toISOString().split("T")[0]}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
