/**
 * Utilidades para el método de Newton-Raphson
 */

export interface FlujoNeto {
  periodo: number;
  flujoNeto: number;
}

/**
 * Calcula el VPN y su derivada para el método de Newton-Raphson
 * @param flujos - Array de flujos de caja
 * @param tasaPeriodo - Tasa de descuento periódica
 * @returns Objeto con VPN y derivada
 */
export function calcularVPNyDerivada(
  flujos: FlujoNeto[],
  tasaPeriodo: number
): { vpn: number; derivada: number } {
  let vpn = 0;
  let derivada = 0;

  for (const flujo of flujos) {
    const factor = Math.pow(1 + tasaPeriodo, flujo.periodo);
    const flujoDescontado = flujo.flujoNeto / factor;

    vpn += flujoDescontado;

    // Derivada del VPN respecto a la tasa
    derivada -=
      (flujo.periodo * flujo.flujoNeto) / (factor * (1 + tasaPeriodo));
  }

  return { vpn, derivada };
}

/**
 * Método de Newton-Raphson genérico para encontrar la tasa de descuento
 * @param flujos - Array de flujos de caja
 * @param frecuenciaPago - Frecuencia de pago anual
 * @param precision - Precisión deseada (default: 1e-6)
 * @param maxIteraciones - Máximo número de iteraciones (default: 100)
 * @returns Tasa anual calculada
 */
export function calcularTasaNewtonRaphson(
  flujos: FlujoNeto[],
  frecuenciaPago: number,
  precision: number = 1e-6,
  maxIteraciones: number = 100
): number {
  const tasaAnual = 0.08; // Tasa inicial estimada (8% anual)
  let tasaPeriodo = tasaAnual / frecuenciaPago;

  for (let i = 0; i < maxIteraciones; i++) {
    const { vpn, derivada } = calcularVPNyDerivada(flujos, tasaPeriodo);

    if (Math.abs(vpn) < precision) {
      // Convertir tasa periódica a anual
      return ((1 + tasaPeriodo) ** frecuenciaPago - 1) * 100;
    }

    if (Math.abs(derivada) < precision) {
      break; // Evitar división por cero
    }

    // Actualizar la tasa usando Newton-Raphson
    const nuevaTasaPeriodo = tasaPeriodo - vpn / derivada;
    tasaPeriodo = nuevaTasaPeriodo;
  }

  // Convertir a tasa anual
  return ((1 + tasaPeriodo) ** frecuenciaPago - 1) * 100;
} 