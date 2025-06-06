import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { BonoData } from "./bonoUtils";

export const exportBonosToPDF = (bonos: (BonoData & { id: string })[]) => {
  const doc = new jsPDF();

  // Título
  doc.setFontSize(20);
  doc.text("Lista de Bonos", 14, 20);

  // Fecha de exportación
  doc.setFontSize(10);
  doc.text(`Exportado el ${new Date().toLocaleDateString("es-PE")}`, 14, 30);

  // Tabla de bonos
  const tableData = bonos.map((bono) => [
    bono.nombre,
    bono.moneda,
    formatCurrency(bono.valorNominal),
    `${bono.plazo} años`,
    formatDate(bono.fechaEmision),
    `${bono.tasaAnual}%`,
  ]);

  autoTable(doc, {
    startY: 40,
    head: [["Nombre", "Moneda", "VN", "Plazo", "Fecha Emisión", "Tasa"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontSize: 10,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
  });

  // Guardar el PDF
  doc.save("bonos.pdf");
};

const formatCurrency = (value: number) => {
  return value.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (date: string | { seconds: number }) => {
  if (typeof date === "string") {
    return new Date(date).toLocaleDateString("es-PE");
  }
  return new Date(date.seconds * 1000).toLocaleDateString("es-PE");
};
