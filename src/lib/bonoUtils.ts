import { db } from "./firebase";
import {
  collection,
  addDoc,
  Timestamp,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import { User } from "firebase/auth";
import {
  calcularTCEA,
  calcularTREA,
  type TCEAParams,
  type TREAParams,
} from "./tceaCalculator";
import {
  calcularPrecioBonoDesdeBono,
  type PrecioBonoResult,
} from "./precioBonoCalculator";

export interface BonoData {
  nombre: string;
  valorNominal: number;
  moneda: string;
  tipoTasa: string;
  tasaAnual: number;
  esTasaDinamica?: boolean;
  tasasPorPeriodo?: Array<{
    desde: number;
    hasta: number;
    tasa: number;
  }>;
  frecuenciaPago: number;
  frecuenciaCapitalizacion?: number;
  plazo: number;
  tipoGracia: string;
  nGracia?: number;
  fechaEmision: string | { seconds: number };
  comisionEmisor: number;
  comisionBonista: number;
  tasaMercado: number;
  userId: string;
  creadoEn?: { seconds: number };
  emisorNombre?: string;
}

export interface BonoStats {
  totalBonos: number;
  proximoVencimiento: string;
  bonosActivos: number;
  valoresPorMoneda: Record<string, number>;
  proximosVencimientos: {
    fecha: string;
    fechaFormatted: string;
    nombre: string;
    valor: number;
    moneda: string;
    diasRestantes: number;
  }[];
}

export interface BonoFullStats {
  totalBonos: number;
  bonosActivos: number;
  bonosVencidos: number;
  valorNominalTotal: number;
  valorNominalVencido: number;
  tasaMaxima: number;
  tasaMinima: number;
  proximoVencimiento: string;
  montosPorMoneda: Record<string, number>;
  evolucionMensual: { mes: string; monto: number }[];
  evolucionMensualPorMoneda: Record<string, { mes: string; monto: number }[]>;
  proximosVencimientos: {
    fecha: string;
    fechaFormatted: string;
    nombre: string;
    valor: number;
    moneda: string;
    diasRestantes: number;
  }[];
}

export const saveBono = async (user: User, bonoData: BonoData) => {
  try {
    const docRef = await addDoc(collection(db, "bonds"), {
      ...bonoData,
      creadoEn: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving bono:", error);
    throw error;
  }
};

export const getBonoStats = async (userId?: string): Promise<BonoStats> => {
  try {
    let q;
    if (userId) {
      // Para emisores: obtener sus propios bonos
      q = query(collection(db, "bonds"), where("userId", "==", userId));
    } else {
      // Para inversionistas: obtener todos los bonos
      q = query(collection(db, "bonds"));
    }

    const snapshot = await getDocs(q);
    const bonos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as (BonoData & { id: string })[];

    // Ordenar los bonos por fecha de emisión en el cliente
    bonos.sort((a, b) => {
      const fechaA =
        typeof a.fechaEmision === "string"
          ? new Date(a.fechaEmision).getTime()
          : a.fechaEmision.seconds * 1000;
      const fechaB =
        typeof b.fechaEmision === "string"
          ? new Date(b.fechaEmision).getTime()
          : b.fechaEmision.seconds * 1000;
      return fechaB - fechaA;
    }); // Calcular estadísticas
    const totalBonos = bonos.length;

    // Calcular valores por moneda
    const valoresPorMoneda: Record<string, number> = {};
    bonos.forEach((bono) => {
      const moneda = bono.moneda;
      valoresPorMoneda[moneda] =
        (valoresPorMoneda[moneda] || 0) + bono.valorNominal;
    }); // Encontrar los próximos vencimientos (hasta 3)
    const hoy = new Date();
    const bonosConVencimiento = bonos.map((bono) => {
      const fechaEmision =
        typeof bono.fechaEmision === "string"
          ? new Date(bono.fechaEmision)
          : new Date(bono.fechaEmision.seconds * 1000);
      const fechaVencimiento = new Date(fechaEmision);
      fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + bono.plazo);
      return {
        ...bono,
        fechaVencimiento,
      };
    });

    const proximosVencimientos = bonosConVencimiento
      .filter((bono) => bono.fechaVencimiento > hoy)
      .sort(
        (a, b) => a.fechaVencimiento.getTime() - b.fechaVencimiento.getTime()
      )
      .slice(0, 3) // Tomar los primeros 3
      .map((bono) => {
        const diasRestantes = Math.ceil(
          (bono.fechaVencimiento.getTime() - hoy.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        const fechaFormatted = bono.fechaVencimiento.toLocaleDateString(
          "es-ES",
          {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }
        );

        return {
          fecha: bono.fechaVencimiento.toISOString(),
          fechaFormatted,
          nombre: bono.nombre,
          valor: bono.valorNominal,
          moneda: bono.moneda,
          diasRestantes,
        };
      });

    const proximoVencimiento = proximosVencimientos[0];

    return {
      totalBonos,
      proximoVencimiento: proximoVencimiento
        ? `${proximoVencimiento.fechaFormatted} (${proximoVencimiento.diasRestantes} días)`
        : "No hay vencimientos próximos",
      bonosActivos: bonosConVencimiento.filter(
        (bono) => bono.fechaVencimiento > hoy
      ).length,
      valoresPorMoneda,
      proximosVencimientos,
    };
  } catch (error) {
    console.error("Error getting bono stats:", error);
    throw error;
  }
};

export const getRecentActivity = async (userId?: string) => {
  try {
    let q;
    if (userId) {
      // Para emisores: obtener sus propios bonos
      q = query(
        collection(db, "bonds"),
        where("userId", "==", userId),
        limit(5)
      );
    } else {
      // Para inversionistas: obtener todos los bonos
      q = query(collection(db, "bonds"), limit(5));
    }

    const snapshot = await getDocs(q);
    const bonos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as (BonoData & { id: string })[];

    // Ordenar por fecha de creación en el cliente
    return bonos.sort((a, b) => {
      const fechaA = a.creadoEn?.seconds || 0;
      const fechaB = b.creadoEn?.seconds || 0;
      return fechaB - fechaA;
    });
  } catch (error) {
    console.error("Error getting recent activity:", error);
    throw error;
  }
};

export const getBonoFullStats = async (
  userId?: string
): Promise<BonoFullStats> => {
  try {
    let q;
    if (userId) {
      q = query(collection(db, "bonds"), where("userId", "==", userId));
    } else {
      q = query(collection(db, "bonds"));
    }
    const snapshot = await getDocs(q);
    const bonos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as (BonoData & { id: string })[];

    // Fechas y hoy
    const hoy = new Date();
    const bonosConFechas = bonos.map((bono) => {
      const fechaEmision =
        typeof bono.fechaEmision === "string"
          ? new Date(bono.fechaEmision)
          : new Date(bono.fechaEmision.seconds * 1000);
      const fechaVencimiento = new Date(fechaEmision);
      fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + bono.plazo);
      return { ...bono, fechaEmision, fechaVencimiento };
    });

    // Activos y vencidos
    const bonosActivos = bonosConFechas.filter((b) => b.fechaVencimiento > hoy);
    const bonosVencidos = bonosConFechas.filter(
      (b) => b.fechaVencimiento <= hoy
    );

    // Valor nominal total y vencido
    const valorNominalTotal = bonos.reduce((acc, b) => acc + b.valorNominal, 0);
    const valorNominalVencido = bonosVencidos.reduce(
      (acc, b) => acc + b.valorNominal,
      0
    ); // Tasas
    const tasas = bonos.map((b) => b.tasaAnual);
    const tasaMaxima = tasas.length > 0 ? Math.max(...tasas) : 0;
    const tasaMinima = tasas.length > 0 ? Math.min(...tasas) : 0; // Próximos vencimientos (hasta 3)
    const proximosVencimientos = bonosActivos
      .sort(
        (a, b) => a.fechaVencimiento.getTime() - b.fechaVencimiento.getTime()
      )
      .slice(0, 3)
      .map((bono) => {
        const diasRestantes = Math.ceil(
          (bono.fechaVencimiento.getTime() - hoy.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        const fechaFormatted = bono.fechaVencimiento.toLocaleDateString(
          "es-ES",
          {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }
        );

        return {
          fecha: bono.fechaVencimiento.toISOString(),
          fechaFormatted,
          nombre: bono.nombre,
          valor: bono.valorNominal,
          moneda: bono.moneda,
          diasRestantes,
        };
      });

    const proximo = proximosVencimientos[0];
    const proximoVencimiento = proximo
      ? `${proximo.fechaFormatted} (${proximo.diasRestantes} días)`
      : "No hay vencimientos próximos";

    // Montos por moneda
    const montosPorMoneda: Record<string, number> = {};
    bonos.forEach((b) => {
      montosPorMoneda[b.moneda] =
        (montosPorMoneda[b.moneda] || 0) + b.valorNominal;
    });

    // Evolución mensual (por fecha de emisión, sumando todas las monedas)
    const evolucionMap: Record<string, number> = {};
    bonosConFechas.forEach((b) => {
      const mes = `${b.fechaEmision.getFullYear()}-${String(
        b.fechaEmision.getMonth() + 1
      ).padStart(2, "0")}`;
      evolucionMap[mes] = (evolucionMap[mes] || 0) + b.valorNominal;
    });
    const evolucionMensual = Object.entries(evolucionMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, monto]) => ({ mes, monto }));

    // Evolución mensual por moneda
    const evolucionPorMoneda: Record<string, Record<string, number>> = {};
    bonosConFechas.forEach((b) => {
      const mes = `${b.fechaEmision.getFullYear()}-${String(
        b.fechaEmision.getMonth() + 1
      ).padStart(2, "0")}`;
      if (!evolucionPorMoneda[b.moneda]) evolucionPorMoneda[b.moneda] = {};
      evolucionPorMoneda[b.moneda][mes] =
        (evolucionPorMoneda[b.moneda][mes] || 0) + b.valorNominal;
    });
    const evolucionMensualPorMoneda: Record<
      string,
      { mes: string; monto: number }[]
    > = {};
    Object.entries(evolucionPorMoneda).forEach(([moneda, data]) => {
      evolucionMensualPorMoneda[moneda] = Object.entries(data)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([mes, monto]) => ({ mes, monto }));
    });
    return {
      totalBonos: bonos.length,
      bonosActivos: bonosActivos.length,
      bonosVencidos: bonosVencidos.length,
      valorNominalTotal,
      valorNominalVencido,
      tasaMaxima: Number(tasaMaxima.toFixed(2)),
      tasaMinima: Number(tasaMinima.toFixed(2)),
      proximoVencimiento,
      montosPorMoneda,
      evolucionMensual,
      evolucionMensualPorMoneda,
      proximosVencimientos,
    };
  } catch (error) {
    console.error("Error getting bono full stats:", error);
    throw error;
  }
};

/**
 * Calcula la TCEA de un bono desde el punto de vista del emisor
 */
export function calcularTCEABono(bono: BonoData): number {
  try {
    const mapGracia = (tipo: string): "Ninguno" | "Total" | "Parcial" => {
      if (tipo === "Sin Gracia" || tipo === "Ninguno") return "Ninguno";
      if (tipo === "Total") return "Total";
      if (tipo === "Parcial") return "Parcial";
      return "Ninguno";
    };

    const tceaParams: TCEAParams = {
      valorNominal: bono.valorNominal,
      tasaAnual: bono.tasaAnual,
      frecuenciaPago: bono.frecuenciaPago,
      plazo: bono.plazo,
      gracia: mapGracia(bono.tipoGracia),
      numPeriodosGracia: bono.nGracia || 0,
      comisionEmisor: bono.comisionEmisor,
      comisionBonista: bono.comisionBonista,
    };

    const resultado = calcularTCEA(tceaParams);
    return resultado.tcea;
  } catch (error) {
    console.error("Error calculando TCEA:", error);
    return 0;
  }
}

/**
 * Calcula la TREA de un bono desde el punto de vista del inversionista
 */
export function calcularTREABono(bono: BonoData): number {
  try {
    const mapGracia = (tipo: string): "Ninguno" | "Total" | "Parcial" => {
      if (tipo === "Sin Gracia" || tipo === "Ninguno") return "Ninguno";
      if (tipo === "Total") return "Total";
      if (tipo === "Parcial") return "Parcial";
      return "Ninguno";
    };

    const treaParams: TREAParams = {
      valorNominal: bono.valorNominal,
      tasaAnual: bono.tasaAnual,
      frecuenciaPago: bono.frecuenciaPago,
      plazo: bono.plazo,
      gracia: mapGracia(bono.tipoGracia),
      numPeriodosGracia: bono.nGracia || 0,
      comisionEmisor: bono.comisionEmisor,
      comisionBonista: bono.comisionBonista,
    };

    const resultado = calcularTREA(treaParams);
    return resultado.trea;
  } catch (error) {
    console.error("Error calculando TREA:", error);
    return 0;
  }
}

/**
 * Calcula el precio de un bono usando la valoración de mercado
 */
export function calcularPrecioBonoWrapper(
  bono: BonoData,
  tasaDescuento?: number
): PrecioBonoResult {
  return calcularPrecioBonoDesdeBono(bono, tasaDescuento);
}
