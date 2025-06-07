"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ProtectedRoute from "@/components/RouteGuard";

const faqs = [
  {
    question: "¿Qué es un bono?",
    answer:
      "Un bono es un instrumento financiero de deuda que representa un préstamo que un inversor hace a un prestatario (generalmente corporativo o gubernamental). El prestatario promete pagar intereses periódicos y devolver el principal al vencimiento.",
  },
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
    question: "¿Cómo funciona el período de gracia?",
    answer:
      "El período de gracia es un tiempo durante el cual el emisor del bono puede diferir el pago de intereses o principal. Puede ser total (no se paga ni intereses ni principal) o parcial (solo se paga intereses).",
  },
  {
    question: "¿Qué son las comisiones del emisor y bonista?",
    answer:
      "Las comisiones son costos adicionales que se aplican al bono. La comisión del emisor es un costo que paga quien emite el bono, mientras que la comisión del bonista es un costo que paga el inversor que compra el bono.",
  },
];

export default function HelpPage() {
  return (
    <ProtectedRoute requiredRole={undefined}>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Centro de Ayuda</h1>

        <div className="grid gap-8">
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
