import ProtectedRoute from "@/components/RouteGuard";

export default function EmisorDashboard() {
  return (
    <ProtectedRoute requiredRole="emisor">
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">Bienvenido, Emisor</h1>
        <p className="text-lg text-gray-700">
          Este es tu panel principal. Aquí podrás crear, publicar y gestionar
          tus bonos corporativos.
        </p>
      </div>
    </ProtectedRoute>
  );
}
