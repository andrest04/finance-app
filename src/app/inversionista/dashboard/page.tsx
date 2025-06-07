import ProtectedRoute from "@/components/RouteGuard";

export default function InversionistaDashboard() {
  return (
    <ProtectedRoute requiredRole="inversionista">
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">Bienvenido, Inversionista</h1>
        <p className="text-lg text-gray-700">
          Este es tu panel principal. Aquí podrás consultar, analizar y simular
          inversiones en bonos corporativos.
        </p>
      </div>
    </ProtectedRoute>
  );
}
