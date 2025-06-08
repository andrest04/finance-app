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

export interface BonoData {
  nombre: string;
  valorNominal: number;
  moneda: string;
  tipoTasa: string;
  tasaAnual: number;
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
  tasaPromedio: number;
  proximoVencimiento: string;
  bonosActivos: number;
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
    });

    // Calcular estadísticas
    const totalBonos = bonos.length;
    const tasaPromedio =
      bonos.length > 0
        ? bonos.reduce((acc, bono) => acc + bono.tasaAnual, 0) / bonos.length
        : 0;

    // Encontrar el próximo vencimiento
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

    const proximoVencimiento = bonosConVencimiento
      .filter((bono) => bono.fechaVencimiento > hoy)
      .sort(
        (a, b) => a.fechaVencimiento.getTime() - b.fechaVencimiento.getTime()
      )[0];

    // Calcular días hasta el próximo vencimiento
    const diasHastaVencimiento = proximoVencimiento
      ? Math.ceil(
          (proximoVencimiento.fechaVencimiento.getTime() - hoy.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

    return {
      totalBonos,
      tasaPromedio: Number(tasaPromedio.toFixed(2)),
      proximoVencimiento:
        diasHastaVencimiento > 0
          ? `${diasHastaVencimiento} días`
          : "No hay vencimientos próximos",
      bonosActivos: bonosConVencimiento.filter(
        (bono) => bono.fechaVencimiento > hoy
      ).length,
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
