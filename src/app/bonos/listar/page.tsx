import BonosList from "@/components/ui/BonosList";

export default function ListaBonosPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">
        Mis Bonos Registrados
      </h1>
      <BonosList />
    </div>
  );
}
