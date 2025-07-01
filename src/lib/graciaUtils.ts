/**
 * Utilidades para el manejo de tipos de gracia en bonos
 */

/**
 * Mapea el tipo de gracia desde string a los tipos válidos
 * @param tipo - Tipo de gracia como string
 * @returns Tipo de gracia tipado
 */
export const mapGracia = (tipo: string): "Ninguno" | "Total" | "Parcial" => {
  if (tipo === "Sin Gracia" || tipo === "Ninguno") return "Ninguno";
  if (tipo === "Total") return "Total";
  if (tipo === "Parcial") return "Parcial";
  return "Ninguno";
}; 