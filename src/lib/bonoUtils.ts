import { db } from "./firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { User } from "firebase/auth";

interface BonoData {
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
  fechaEmision: string;
  comisionEmisor: number;
  comisionBonista: number;
  tasaMercado: number;
}

export async function saveBono(user: User, data: BonoData) {
  try {
    const ref = collection(db, "usuarios", user.uid, "bonos");
    const bonoGuardado = {
      ...data,
      creadoEn: Timestamp.now(),
    };
    await addDoc(ref, bonoGuardado);
  } catch (error) {
    console.error("Error guardando bono:", error);
    throw error;
  }
}
