// Test básico para validar duración, duración modificada y convexidad
import { calcularDuracion, calcularDuracionModificada, calcularConvexidad } from './indicadoresBono.js';

// Bono bullet: 3 años, nominal 1000, cupón 10% anual, sin amortización
const flujos = [
  { periodo: 1, flujo: 100 },
  { periodo: 2, flujo: 100 },
  { periodo: 3, flujo: 1100 }, // último pago incluye nominal
];
const tasa = 0.10; // 10% anual

const duracion = calcularDuracion(flujos, tasa);
const duracionMod = calcularDuracionModificada(flujos, tasa);
const convexidad = calcularConvexidad(flujos, tasa);

console.log('Duración:', duracion.toFixed(4));
console.log('Duración Modificada:', duracionMod.toFixed(4));
console.log('Convexidad:', convexidad.toFixed(4));

// Valores esperados aproximados (calculados manualmente o con Excel):
// Duración ~2.7355
// Duración Modificada ~2.4868
// Convexidad ~8.8086
