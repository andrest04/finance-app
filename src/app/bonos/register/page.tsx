import BonoForm from "@/components/ui/BonoForm";
import ProtectedRoute from "@/components/RouteGuard";

export default function RegistroBonoPage() {
  return (
    <ProtectedRoute requiredRole="emisor">
      <main className="p-6">
        {" "}
        <h1 className="text-2xl font-bold mb-4 text-gray-800">
          Registro de Bono Corporativo - Método Francés
        </h1>
        <BonoForm />
      </main>
    </ProtectedRoute>
  );
}
