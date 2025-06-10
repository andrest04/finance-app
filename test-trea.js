// Test rápido para verificar el cálculo de TREA
import { calcularTREABono } from './src/lib/bonoUtils.ts';

// Ejemplo de bono para probar
const bonoEjemplo = {
  nombre: "Bono Test",
  valorNominal: 1000,
  moneda: "PEN",
  tipoTasa: "Efectiva",
  tasaAnual: 10,
  frecuenciaPago: 2, // Semestral
  plazo: 3,
  tipoGracia: "Sin Gracia",
  nGracia: 0,
  fechaEmision: "2024-01-01",
  comisionEmisor: 1.5,
  comisionBonista: 1.0,
  tasaMercado: 0, // Este se calculará
  userId: "test",
  emisorNombre: "Emisor Test"
};

try {
  const trea = calcularTREABono(bonoEjemplo);
  console.log(`TREA calculado: ${trea.toFixed(4)}%`);
} catch (error) {
  console.error("Error:", error.message);
}
