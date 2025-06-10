// Funciones para calcular duración, duración modificada y convexidad de un bono
// Todas las fórmulas asumen flujos de caja periódicos y tasa de descuento efectiva por periodo
export function calcularDuracion(flujos, tasa) {
    let sumaPV = 0;
    let sumaPVt = 0;
    for (const { periodo, flujo } of flujos) {
        const pv = flujo / Math.pow(1 + tasa, periodo);
        sumaPV += pv;
        sumaPVt += periodo * pv;
    }
    return sumaPV === 0 ? 0 : sumaPVt / sumaPV;
}
export function calcularDuracionModificada(flujos, tasa) {
    const duracion = calcularDuracion(flujos, tasa);
    return duracion / (1 + tasa);
}
export function calcularConvexidad(flujos, tasa) {
    let sumaPV = 0;
    let sumaConv = 0;
    for (const { periodo, flujo } of flujos) {
        const pv = flujo / Math.pow(1 + tasa, periodo);
        sumaPV += pv;
        sumaConv += pv * periodo * (periodo + 1);
    }
    return sumaPV === 0 ? 0 : sumaConv / (sumaPV * Math.pow(1 + tasa, 2));
}
