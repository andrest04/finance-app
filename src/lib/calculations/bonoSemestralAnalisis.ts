/**
 * Fórmulas financieras específicas para bonos con pagos semestrales y tasas anuales efectivas (TEA)
 * Implementación completa de todas las fórmulas de análisis de bonos
 */

export interface BonoSemestralParams {
  valorNominal: number;
  tea: number; // Tasa Efectiva Anual (%)
  plazo: number; // en años
  tasaMercadoTEA: number; // TEA del mercado para descuento (%)
  comisionEmisor: number; // %
  comisionBonista: number; // %
  comisionCavali: number; // % (típicamente 0.06%)
}

export interface AnalisisBonoSemestral {
  // Tasas convertidas
  tes: number; // Tasa Efectiva Semestral
  tesMercado: number; // TES de mercado

  // Flujos del bono
  cuponSemestral: number;
  numeroSemestres: number;
  flujosSemestrales: Array<{
    periodo: number;
    cupon: number;
    principal: number;
    total: number;
  }>;

  // Precio del bono
  precio: number;
  precioMaximoMercado: number;

  // Costos y flujos netos
  montoNetoRecibidoEmisor: number;
  inversionTotalInversionista: number;

  // Tasas de rendimiento
  tceaEmisor: number;
  treaInversionista: number;
  treaSinSAB: number; // TREA sin incluir SAB (comisiones)

  // Indicadores de riesgo
  duracionMacaulay: number; // en años
  duracionModificada: number;
  convexidad: number;

  // Clasificación
  esPremium: boolean;
  esDescuento: boolean;
  esParidad: boolean;
}

/**
 * 1. Conversión de TEA a TES (Tasa Efectiva Semestral)
 * TES = (1 + TEA)^(1/2) - 1
 * Nota: La fórmula original usaba 180/360 pero la correcta para semestral es 1/2
 */
export function convertirTEAaTES(tea: number): number {
  if (tea < 0) throw new Error("TEA no puede ser negativa");
  return Math.pow(1 + tea / 100, 1 / 2) - 1;
}

/**
 * 2. Cálculo del cupón semestral
 * Cupon = ValorNominal × TES
 */
export function calcularCuponSemestral(
  valorNominal: number,
  tes: number
): number {
  if (valorNominal <= 0) throw new Error("Valor nominal debe ser positivo");
  return valorNominal * tes;
}

/**
 * 3. Precio del bono descontado al TES del mercado
 * Precio = Σ_{t=1}^{n-1} (Cupon / (1 + r)^t) + ((Cupon + ValorNominal) / (1 + r)^n)
 */
export function calcularPrecioBono(
  valorNominal: number,
  cuponSemestral: number,
  numeroSemestres: number,
  tesMercado: number
): number {
  if (numeroSemestres <= 0)
    throw new Error("Número de semestres debe ser positivo");
  if (tesMercado < 0) throw new Error("TES de mercado no puede ser negativa");

  let precio = 0;

  // Cupones intermedios
  for (let t = 1; t < numeroSemestres; t++) {
    precio += cuponSemestral / Math.pow(1 + tesMercado, t);
  }

  // Último flujo (cupón + principal)
  const ultimoFlujo = cuponSemestral + valorNominal;
  precio += ultimoFlujo / Math.pow(1 + tesMercado, numeroSemestres);

  return precio;
}

/**
 * 4. TCEA del emisor (convertida desde la TIR semestral)
 * TCEA = (1 + TIR_sem)^2 - 1
 */
export function calcularTCEAEmisor(
  montoNetoRecibido: number,
  flujosPagos: number[], // Flujos semestrales que paga el emisor
  precision: number = 0.0001
): number {
  // Resolver para TIR semestral usando Newton-Raphson
  const tirSemestral = calcularTIRSemestral(
    montoNetoRecibido,
    flujosPagos,
    precision
  );

  // Convertir a TCEA anual
  const tcea = (Math.pow(1 + tirSemestral, 2) - 1) * 100;

  return Number(tcea.toFixed(4));
}

/**
 * 5. TREA del inversionista (sin incluir SAB)
 * TREA = (1 + TIR_sem)^2 - 1
 */
export function calcularTREAInversionista(
  inversionInicial: number,
  flujosIngresos: number[], // Flujos semestrales que recibe el inversionista
  precision: number = 0.0001
): number {
  // Resolver para TIR semestral
  const tirSemestral = calcularTIRSemestral(
    inversionInicial,
    flujosIngresos,
    precision
  );

  // Convertir a TREA anual
  const trea = (Math.pow(1 + tirSemestral, 2) - 1) * 100;

  return Number(trea.toFixed(4));
}

/**
 * 6. Duración de Macaulay
 * D = Σ_{t=1}^{n} [t × PV(CF_t)] / Precio
 */
export function calcularDuracionMacaulay(
  flujos: Array<{ periodo: number; flujo: number }>,
  tesMercado: number,
  precio: number
): number {
  if (precio <= 0) throw new Error("Precio debe ser positivo");

  let sumaPonderada = 0;

  flujos.forEach(({ periodo, flujo }) => {
    const valorPresente = flujo / Math.pow(1 + tesMercado, periodo);
    sumaPonderada += periodo * valorPresente;
  });

  // Convertir a años (dividir por 2 porque los períodos son semestrales)
  const duracionEnAnios = sumaPonderada / precio / 2;

  return Number(duracionEnAnios.toFixed(4));
}

/**
 * 7. Duración modificada
 * D* = D / (1 + r)
 */
export function calcularDuracionModificada(
  duracionMacaulay: number,
  tesMercado: number
): number {
  return Number((duracionMacaulay / (1 + tesMercado)).toFixed(4));
}

/**
 * 8. Convexidad
 * Convexidad ≈ (1 / Precio) × Σ_{t=1}^{n} [CF_t × t(t + 1)] / (1 + r)^{t + 2}
 */
export function calcularConvexidad(
  flujos: Array<{ periodo: number; flujo: number }>,
  tesMercado: number,
  precio: number
): number {
  if (precio <= 0) throw new Error("Precio debe ser positivo");

  let sumaConvexidad = 0;

  flujos.forEach(({ periodo, flujo }) => {
    const termino =
      (flujo * periodo * (periodo + 1)) / Math.pow(1 + tesMercado, periodo + 2);
    sumaConvexidad += termino;
  });

  // Convertir a base anual (dividir por 4 porque es semestral al cuadrado)
  const convexidad = sumaConvexidad / precio / 4;

  return Number(convexidad.toFixed(4));
}

/**
 * 9. Precio máximo que pagaría el mercado
 * Igual al cálculo del precio del bono usando como tasa de descuento el COK (TES del mercado)
 */
export function calcularPrecioMaximoMercado(
  valorNominal: number,
  cuponSemestral: number,
  numeroSemestres: number,
  tesCOK: number
): number {
  return calcularPrecioBono(
    valorNominal,
    cuponSemestral,
    numeroSemestres,
    tesCOK
  );
}

/**
 * Función principal que calcula todo el análisis del bono semestral
 */
export function analizarBonoSemestral(
  params: BonoSemestralParams
): AnalisisBonoSemestral {
  const {
    valorNominal,
    tea,
    plazo,
    tasaMercadoTEA,
    comisionEmisor,
    comisionBonista,
    comisionCavali = 0.06,
  } = params;

  // Validaciones
  if (valorNominal <= 0) throw new Error("Valor nominal debe ser positivo");
  if (tea < 0) throw new Error("TEA no puede ser negativa");
  if (plazo <= 0) throw new Error("Plazo debe ser positivo");
  if (tasaMercadoTEA < 0)
    throw new Error("Tasa de mercado no puede ser negativa");

  // 1. Conversiones de tasas
  const tes = convertirTEAaTES(tea);
  const tesMercado = convertirTEAaTES(tasaMercadoTEA);
  const tesCOK = tesMercado; // COK es la tasa de mercado

  // 2. Parámetros del bono
  const numeroSemestres = plazo * 2;
  const cuponSemestral = calcularCuponSemestral(valorNominal, tes);

  // 3. Flujos del bono
  const flujosSemestrales = [];
  for (let periodo = 1; periodo <= numeroSemestres; periodo++) {
    const esFinal = periodo === numeroSemestres;
    const cupon = cuponSemestral;
    const principal = esFinal ? valorNominal : 0;
    const total = cupon + principal;

    flujosSemestrales.push({
      periodo,
      cupon,
      principal,
      total,
    });
  }

  // 4. Precios
  const precio = calcularPrecioBono(
    valorNominal,
    cuponSemestral,
    numeroSemestres,
    tesMercado
  );
  const precioMaximoMercado = calcularPrecioMaximoMercado(
    valorNominal,
    cuponSemestral,
    numeroSemestres,
    tesCOK
  );

  // 5. Costos y flujos netos
  const comisionEmisorMonto = valorNominal * (comisionEmisor / 100);
  const comisionBonistaMonto = precio * (comisionBonista / 100);
  const comisionCavaliMonto = precio * (comisionCavali / 100);

  const montoNetoRecibidoEmisor =
    precio - comisionEmisorMonto - comisionBonistaMonto;
  const inversionTotalInversionista =
    precio + comisionBonistaMonto + comisionCavaliMonto;
  const inversionSinSAB = precio + comisionCavaliMonto; // Sin incluir SAB (comisión bonista)

  // 6. Flujos para cálculo de TIR
  const flujosPagosEmisor = flujosSemestrales.map((f) => f.total);
  const flujosIngresosInversionista = flujosSemestrales.map((f) => f.total);

  // 7. Cálculo de tasas de rendimiento
  const tceaEmisor = calcularTCEAEmisor(
    montoNetoRecibidoEmisor,
    flujosPagosEmisor
  );
  const treaInversionista = calcularTREAInversionista(
    inversionTotalInversionista,
    flujosIngresosInversionista
  );
  const treaSinSAB = calcularTREAInversionista(
    inversionSinSAB,
    flujosIngresosInversionista
  );

  // 8. Indicadores de riesgo
  const flujosParaDuracion = flujosSemestrales.map((f) => ({
    periodo: f.periodo,
    flujo: f.total,
  }));

  const duracionMacaulay = calcularDuracionMacaulay(
    flujosParaDuracion,
    tesMercado,
    precio
  );
  const duracionModificada = calcularDuracionModificada(
    duracionMacaulay,
    tesMercado
  );
  const convexidad = calcularConvexidad(flujosParaDuracion, tesMercado, precio);

  // 9. Clasificación del bono
  const tolerancia = 0.01; // 1 centavo de tolerancia
  const esPremium = precio > valorNominal + tolerancia;
  const esDescuento = precio < valorNominal - tolerancia;
  const esParidad = !esPremium && !esDescuento;

  return {
    // Tasas convertidas
    tes: Number((tes * 100).toFixed(4)),
    tesMercado: Number((tesMercado * 100).toFixed(4)),

    // Flujos del bono
    cuponSemestral: Number(cuponSemestral.toFixed(4)),
    numeroSemestres,
    flujosSemestrales,

    // Precio del bono
    precio: Number(precio.toFixed(4)),
    precioMaximoMercado: Number(precioMaximoMercado.toFixed(4)),

    // Costos y flujos netos
    montoNetoRecibidoEmisor: Number(montoNetoRecibidoEmisor.toFixed(4)),
    inversionTotalInversionista: Number(inversionTotalInversionista.toFixed(4)),

    // Tasas de rendimiento
    tceaEmisor,
    treaInversionista,
    treaSinSAB,

    // Indicadores de riesgo
    duracionMacaulay,
    duracionModificada,
    convexidad,

    // Clasificación
    esPremium,
    esDescuento,
    esParidad,
  };
}

/**
 * Función auxiliar para calcular TIR semestral usando Newton-Raphson
 */
function calcularTIRSemestral(
  flujoInicial: number,
  flujos: number[],
  precision: number = 0.0001,
  maxIteraciones: number = 100
): number {
  let tir = 0.05; // Estimación inicial del 5% semestral

  for (let i = 0; i < maxIteraciones; i++) {
    let vpn = -flujoInicial; // Flujo inicial es negativo
    let derivada = 0;

    // Calcular VPN y su derivada
    flujos.forEach((flujo, periodo) => {
      const p = periodo + 1;
      const factor = Math.pow(1 + tir, p);
      vpn += flujo / factor;
      derivada -= (p * flujo) / (factor * (1 + tir));
    });

    // Newton-Raphson
    if (Math.abs(derivada) < precision) break;

    const nuevaTir = tir - vpn / derivada;

    if (Math.abs(nuevaTir - tir) < precision) {
      return nuevaTir;
    }

    tir = nuevaTir;
  }

  return tir;
}

/**
 * Función de utilidad para validar y formatear resultados
 */
export function validarResultados(analisis: AnalisisBonoSemestral): void {
  const campos = [
    "tes",
    "tesMercado",
    "cuponSemestral",
    "precio",
    "precioMaximoMercado",
    "montoNetoRecibidoEmisor",
    "inversionTotalInversionista",
    "tceaEmisor",
    "treaInversionista",
    "treaSinSAB",
    "duracionMacaulay",
    "duracionModificada",
    "convexidad",
  ];

  campos.forEach((campo) => {
    const valor = analisis[campo as keyof AnalisisBonoSemestral] as number;
    if (typeof valor !== "number" || isNaN(valor) || !isFinite(valor)) {
      throw new Error(`Valor inválido para ${campo}: ${valor}`);
    }
  });
}
