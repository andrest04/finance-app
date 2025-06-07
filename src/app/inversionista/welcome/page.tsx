import ProtectedRoute from "@/components/RouteGuard";

export default function InversionistaWelcome() {
  return (
    <ProtectedRoute requiredRole="inversionista">
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <h1 className="text-3xl font-bold text-green-800 mb-4">
          ¡Bienvenido, Inversionista!
        </h1>
        <p className="text-lg text-gray-700 mb-6">
          Explora y analiza bonos disponibles, simula inversiones y toma
          decisiones informadas para tu portafolio.
        </p>
      </div>
    </ProtectedRoute>
  );
}
