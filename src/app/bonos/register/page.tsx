import BonoFormEnhanced from "@/components/ui/BonoFormEnhanced";
import ProtectedRoute from "@/components/RouteGuard";

export default function RegistroBonoPage() {
  return (
    <ProtectedRoute requiredRole="emisor">
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Registro de Bono Corporativo
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              Método Francés - Cuotas Constantes
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-blue-700">
              <span className="px-3 py-1 bg-blue-100 rounded-full font-medium">
                📊 Cálculos Automáticos
              </span>
              <span className="px-3 py-1 bg-green-100 rounded-full font-medium">
                ⚡ Tiempo Real
              </span>
              <span className="px-3 py-1 bg-purple-100 rounded-full font-medium">
                🔧 TREA Automática
              </span>
            </div>
          </div>
          <BonoFormEnhanced />
        </div>
      </main>
    </ProtectedRoute>
  );
}
