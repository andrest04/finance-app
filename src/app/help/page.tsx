"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ProtectedRoute from "@/components/RouteGuard";

const faqs = [
  // Conceptos Básicos
  {
    question: "¿Qué es un bono?",
    answer:
      "Un bono es un instrumento financiero de deuda que representa un préstamo que un inversor hace a un prestatario (generalmente corporativo o gubernamental). El prestatario promete pagar intereses periódicos y devolver el principal al vencimiento.",
  },
  {
    question: "¿Cuáles son los tipos de bonos más comunes?",
    answer:
      "Los tipos más comunes de bonos incluyen: bonos corporativos (emitidos por empresas), bonos gubernamentales (emitidos por gobiernos), bonos municipales (emitidos por gobiernos locales), y bonos convertibles (que pueden convertirse en acciones). Cada tipo tiene diferentes niveles de riesgo y rendimiento.",
  },
  {
    question: "¿Qué es el valor nominal de un bono?",
    answer:
      "El valor nominal (o valor facial) es el monto que el emisor se compromete a devolver al vencimiento del bono. Es el monto base sobre el cual se calculan los pagos de intereses.",
  },

  // Tasas y Rendimientos
  {
    question: "¿Cómo se calcula el valor de un bono?",
    answer:
      "El valor de un bono se calcula descontando los flujos futuros de efectivo (cupones y principal) a una tasa de descuento apropiada. La fórmula básica considera el valor nominal, la tasa de cupón, la frecuencia de pago y el plazo hasta el vencimiento.",
  },
  {
    question: "¿Qué es la tasa de mercado (TREA)?",
    answer:
      "La Tasa de Rendimiento Efectiva Anual (TREA) es la tasa que representa el rendimiento real que obtendrá el inversor, considerando todos los costos y comisiones asociados con la inversión.",
  },
  {
    question: "¿Qué es la TIR y cómo se interpreta?",
    answer:
      "La Tasa Interna de Retorno (TIR) es la tasa de descuento que hace que el valor presente de los flujos futuros sea igual al precio actual del bono. Una TIR más alta indica un mejor rendimiento potencial de la inversión.",
  },

  // Características y Términos
  {
    question: "¿Cómo funciona el período de gracia?",
    answer:
      "El período de gracia es un tiempo durante el cual el emisor del bono puede diferir el pago de intereses o principal. Puede ser total (no se paga ni intereses ni principal) o parcial (solo se paga intereses).",
  },
  {
    question: "¿Qué son las comisiones del emisor y bonista?",
    answer:
      "Las comisiones son costos adicionales que se aplican al bono. La comisión del emisor es un costo que paga quien emite el bono, mientras que la comisión del bonista es un costo que paga el inversor que compra el bono.",
  },
  {
    question: "¿Qué es la frecuencia de pago y capitalización?",
    answer:
      "La frecuencia de pago determina cada cuánto se pagan los intereses (cupones) del bono. La frecuencia de capitalización indica cada cuánto se reinvierten los intereses. Ambas pueden ser anual, semestral, trimestral, etc.",
  },

  // Riesgos y Consideraciones
  {
    question: "¿Cuáles son los principales riesgos al invertir en bonos?",
    answer:
      "Los principales riesgos incluyen: riesgo de crédito (incumplimiento del emisor), riesgo de tasa de interés (fluctuaciones en las tasas de mercado), riesgo de liquidez (dificultad para vender el bono), y riesgo de inflación (pérdida de poder adquisitivo).",
  },
  {
    question: "¿Qué es la duración (duration) de un bono?",
    answer:
      "La duración mide la sensibilidad del precio del bono a los cambios en las tasas de interés. Un bono con mayor duración es más sensible a los cambios en las tasas de interés.",
  },

  // Uso de la Plataforma
  {
    question: "¿Cómo puedo registrar un nuevo bono?",
    answer:
      "Para registrar un nuevo bono, diríjase a la sección 'Registrar Bono' en el menú principal. Complete todos los campos requeridos del formulario, incluyendo los datos básicos del bono, tasas, plazos y comisiones.",
  },
  {
    question: "¿Cómo puedo analizar diferentes bonos?",
    answer:
      "En la sección 'Análisis de Bonos' puede comparar diferentes bonos, ver sus características principales, calcular indicadores financieros y realizar análisis de sensibilidad para diferentes escenarios.",
  },
  {
    question: "¿Cómo interpreto las estadísticas de los bonos?",
    answer:
      "Las estadísticas muestran información agregada sobre los bonos disponibles, incluyendo tasas promedio, volúmenes de emisión, próximos vencimientos y tendencias del mercado. Esta información le ayuda a tomar decisiones de inversión informadas.",
  },
];

export default function HelpPage() {
  return (
    <ProtectedRoute requiredRole={undefined}>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Centro de Ayuda</h1>

        <div className="grid gap-8">
          {/* Guía Rápida */}
          <section className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-2xl font-semibold mb-4">Guía Rápida</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">
                  Para Emisores
                </h3>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
                  <li>Registre sus bonos con todos los detalles requeridos</li>
                  <li>Monitoree el rendimiento de sus emisiones</li>
                  <li>Gestiona los pagos y vencimientos</li>
                  <li>Accede a estadísticas de mercado</li>
                </ul>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">
                  Para Inversionistas
                </h3>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
                  <li>Explore bonos disponibles en el mercado</li>
                  <li>Compare diferentes opciones de inversión</li>
                  <li>Analice rendimientos y riesgos</li>
                  <li>Realice simulaciones de inversión</li>
                </ul>
              </div>
            </div>
          </section>

          {/* FAQs */}
          <section className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-2xl font-semibold mb-6">
              Preguntas Frecuentes
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        </div>
      </div>
    </ProtectedRoute>
  );
}
