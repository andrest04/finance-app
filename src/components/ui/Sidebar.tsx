"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useCurrentUser } from "@/lib/useCurrentUser";
import {
  Home,
  PlusCircle,
  BarChart2,
  List,
  LogOut,
  User,
  Settings,
  HelpCircle,
  Menu,
  X,
  Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navigationItems = [
  {
    name: "Dashboard",
    href: "/welcome",
    icon: Home,
  },
  {
    name: "Registrar Bono",
    href: "/bonos/register",
    icon: PlusCircle,
  },
  {
    name: "Análisis de Bono",
    href: "/bonos/analisis",
    icon: BarChart2,
  },
  {
    name: "Listar Bonos",
    href: "/bonos/list",
    icon: List,
  },
];

const bottomNavigationItems = [
  {
    name: "Fórmulas",
    href: "/formulas",
    icon: Calculator,
  },
  {
    name: "Préstamos Variables",
    href: "/prestamos",
    icon: Calculator,
  },
  {
    name: "Perfil",
    href: "/profile",
    icon: User,
  },
  {
    name: "Configuración",
    href: "/settings",
    icon: Settings,
  },
  {
    name: "Ayuda",
    href: "/help",
    icon: HelpCircle,
  },
];

const roleNavigationMap: Record<string, typeof navigationItems> = {
  emisor: [
    { name: "Dashboard", href: "/emisor/dashboard", icon: Home },
    { name: "Registrar Bono", href: "/bonos/register", icon: PlusCircle },
    { name: "Listar Bonos", href: "/bonos/list", icon: List },
    { name: "Análisis de Bonos", href: "/bonos/analisis", icon: BarChart2 },
  ],
  inversionista: [
    { name: "Dashboard", href: "/inversionista/dashboard", icon: Home },
    { name: "Listar Bonos", href: "/bonos/list", icon: List },
    { name: "Análisis de Bonos", href: "/bonos/analisis", icon: BarChart2 },
  ],
  // Ejemplo para admin o auditor:
  // admin: [ ... ],
  // auditor: [ ... ],
};

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, firebaseUser } = useCurrentUser();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  // Elegir menú según el rol, o menú mínimo si no hay rol
  let roleNavigationItems = navigationItems;
  if (profile?.role && roleNavigationMap[profile.role]) {
    roleNavigationItems = roleNavigationMap[profile.role];
  } else if (!profile?.role) {
    // Menú mínimo para usuarios sin rol
    roleNavigationItems = [{ name: "Dashboard", href: "/welcome", icon: Home }];
  }

  // Sidebar content as a function for reuse
  const sidebarContent = (
    <aside className="w-64 min-h-screen bg-gradient-to-b from-blue-600 to-blue-700 text-white flex flex-col justify-between p-4 border-r border-blue-500/20 sticky top-0">
      {/* Parte superior: Perfil */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-white/10 backdrop-blur-sm">
          {firebaseUser?.photoURL ? (
            <Image
              src={firebaseUser.photoURL}
              alt="Perfil"
              width={48}
              height={48}
              className="rounded-full border-2 border-white/20 object-cover"
            />
          ) : (
            <Image
              src="/avatar.png"
              alt="Avatar por defecto"
              width={48}
              height={48}
              className="rounded-full border-2 border-white/20 object-cover"
            />
          )}
          <div>
            <p className="text-lg font-semibold leading-none">
              {profile
                ? `${profile.firstName} ${profile.lastName}`
                : "Cargando..."}
            </p>
            <p className="text-sm opacity-75">
              {profile?.role === "emisor"
                ? "Emisor"
                : profile?.role === "inversionista"
                ? "Inversionista"
                : "Bonista"}
            </p>
          </div>
        </div>

        {/* Navegación principal */}
        <nav className="space-y-1">
          {roleNavigationItems.map((item, idx) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-white hover:bg-white/10 transition-all duration-200 group relative px-3 py-2 rounded-lg",
                    isActive && "bg-white/30 text-blue-900 font-bold shadow-md",
                    idx === 0 && "mt-2"
                  )}
                >
                  <item.icon className="mr-2 h-5 w-5" />
                  {item.name}
                  {isActive && (
                    <span className="absolute right-2 w-2 h-2 rounded-full bg-white border-2 border-blue-700 shadow" />
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>
        <div className="my-4 border-t border-white/20" />
      </div>

      {/* Parte inferior: Navegación secundaria y Logout */}
      <div className="space-y-4">
        {/* Navegación secundaria */}
        <nav className="space-y-1">
          {bottomNavigationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 group relative px-3 py-2 rounded-lg",
                    isActive && "bg-white/30 text-blue-900 font-bold shadow-md"
                  )}
                >
                  <item.icon className="mr-2 h-5 w-5" />
                  {item.name}
                  {isActive && (
                    <span className="absolute right-2 w-2 h-2 rounded-full bg-white border-2 border-blue-700 shadow" />
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>
        <div className="my-2 border-t border-white/20" />
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border-white/30"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          Cerrar sesión
        </Button>

        {/* Footer */}
        <p className="text-xs text-center text-white/60">
          © {new Date().getFullYear()} Tu equipo
        </p>
      </div>
    </aside>
  );

  return (
    <>
      {/* Botón hamburguesa solo en móvil */}
      <button
        className="md:hidden fixed top-4 left-4 z-40 bg-blue-600 p-2 rounded-full shadow-lg text-white hover:bg-blue-700 transition"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
      >
        <Menu className="w-6 h-6" />
      </button>
      {/* Sidebar fijo en desktop */}
      <div className="hidden md:block">{sidebarContent}</div>
      {/* Sidebar overlay en móvil */}
      {open && (
        <div className="fixed inset-0 z-50 flex">
          {/* Fondo oscuro */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Sidebar deslizante */}
          <div className="relative z-50 animate-slide-in-left">
            <button
              className="absolute top-4 right-4 text-white bg-blue-600 rounded-full p-1 hover:bg-blue-700 z-50"
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
            >
              <X className="w-6 h-6" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
