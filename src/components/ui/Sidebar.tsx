"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useCurrentUser } from "@/lib/useCurrentUser";

export default function Sidebar() {
  const router = useRouter();
  const { profile, firebaseUser } = useCurrentUser();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <aside className="h-screen w-64 bg-blue-600 text-white flex flex-col justify-between p-4">
      {/* Parte superior: Perfil */}
      <div>
        <div className="flex items-center gap-3 mb-8">
          {firebaseUser?.photoURL ? (
            <Image
              src={firebaseUser.photoURL}
              alt="Perfil"
              width={48}
              height={48}
              className="rounded-full border-2 border-white object-cover"
            />
          ) : (
            <Image
              src="/avatar.png"
              alt="Avatar por defecto"
              width={48}
              height={48}
              className="rounded-full border-2 border-white object-cover"
            />
          )}
          <div>
            <p className="text-lg font-semibold leading-none">
              {profile
                ? `${profile.firstName} ${profile.lastName}`
                : "Cargando..."}
            </p>
            <p className="text-sm opacity-75">Personal</p>
          </div>
        </div>

        <nav className="space-y-2">
          <Link href="/welcome">
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-blue-500"
            >
              🏠 Dashboard
            </Button>
          </Link>
          <Link href="/bonos/register">
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-blue-500"
            >
              💳 Registrar Bono
            </Button>
          </Link>
          <Link href="/bonos/analisis">
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-blue-500"
            >
              📊 Análisis de Bono
            </Button>
          </Link>
          <Link href="/bonos/listar">
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-blue-500"
            >
              📋 Listar Bonos
            </Button>
          </Link>
        </nav>
      </div>

      {/* Parte inferior: Logout */}
      <div>
        <Button
          variant="outline"
          className="w-full border-2 border-white text-white bg-transparent hover:bg-white hover:text-red-600 hover:border-red-600 transition-all duration-200 flex justify-center items-center font-semibold py-3 group"
          onClick={handleLogout}
        >
          <span className="font-semibold group-hover:text-red-600">
            Cerrar sesión
          </span>
          <span className="ml-2 opacity-0 group-hover:opacity-100 text-xs transition-opacity duration-200 group-hover:text-red-600">
            ¿Seguro?
          </span>
        </Button>
        <p className="text-xs text-center mt-2 opacity-60">© Tu equipo</p>
      </div>
    </aside>
  );
}
