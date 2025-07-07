// Exportar tipos
export type {
  BonoFormData,
  GraciaPeriodoBono,
  CalculatedMetrics,
  ValidationResult,
} from "./types";

// Exportar esquema de validación
export { bonoFormSchema } from "./types";

// Exportar utilidades de validación
export {
  validarPeriodosGracia,
  validarGraciaContraTotalPeriodos,
  validarSolapamientosGracia,
  obtenerLimitesInput,
} from "./validations";

// Exportar componentes
export { DatosBonoSection } from "./DatosBonoSection";
export { CondicionesFinancierasSection } from "./CondicionesFinancierasSection";
export { CostosEmisorSection } from "./CostosEmisorSection";
export { GraciaSection } from "./GraciaSection";
export { ResultadosSection } from "./ResultadosSection";

// Exportar nuevos componentes modulares
export { RealTimeCalculationsPanel } from "./RealTimeCalculationsPanel";
export { FrenchMethodPreview } from "./FrenchMethodPreview";
export { DynamicGracePreview } from "./DynamicGracePreview";

// Exportar hooks personalizados
export { useDynamicGracePeriods } from "./useDynamicGracePeriods";
export { useRealTimeCalculations } from "./useRealTimeCalculations";
export { useUserSettings } from "./useUserSettings";
