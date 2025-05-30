const seccionesBono: { [key: string]: string[] } = {
  "Datos Básicos": [
    "nombre",
    "moneda",
    "valorNominal",
    "plazo",
    "fechaEmision",
  ],
  "Tasa y Frecuencia": [
    "tipoTasa",
    "tasaAnual",
    "frecuenciaPago",
    "frecuenciaCapitalizacion",
  ],
  "Plazo y Gracia": ["tipoGracia", "nGracia"],
  "Costos y Mercado": ["comisionEmisor", "comisionBonista", "tasaMercado"],
};

export default seccionesBono;