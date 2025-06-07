import BonosList from "@/components/ui/BonoList";
import ProtectedRoute from "@/components/RouteGuard";

export default function ListaBonosPage() {
  return (
    <ProtectedRoute requiredRole={undefined}>
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">
          Mis Bonos Registrados
        </h1>
        <BonosList />
      </div>
    </ProtectedRoute>
  );
}
