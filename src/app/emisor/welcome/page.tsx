import ProtectedRoute from "@/components/RouteGuard";

export default function EmisorWelcome() {
  return (
    <ProtectedRoute requiredRole="emisor">
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <h1 className="text-3xl font-bold text-blue-800 mb-4">
          ¡Bienvenido, Emisor!
        </h1>
        <p className="text-lg text-gray-700 mb-6">
          Aquí podrás gestionar y publicar tus bonos corporativos, ver
          estadísticas y acceder a herramientas exclusivas para emisores.
        </p>
      </div>
    </ProtectedRoute>
  );
}
