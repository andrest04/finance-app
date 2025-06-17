"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "@/lib/firebase";
import { saveUserData } from "@/lib/userUtils";
import { getErrorMessage } from "@/lib/errorMessages";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "emisor",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      setIsLoading(false);
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      await saveUserData(userCredential.user, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
      });
      if (formData.role === "emisor") {
        router.push("/emisor/dashboard");
      } else {
        router.push("/inversionista/dashboard");
      }
    } catch (error: unknown) {
      console.error("Registration error:", error);

      // Handle specific Firebase Auth errors
      if (error instanceof Error) {
        const errorCode = error.message.includes("auth/email-already-in-use");

        if (errorCode) {
          setError(
            "Esta cuenta ya está registrada. Si eliminaste tu perfil anteriormente, " +
              "puedes intentar iniciar sesión y el sistema recreará tu perfil automáticamente. " +
              "O contacta al administrador para limpiar la cuenta completamente."
          );
          return;
        }
      }

      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };  const handleGoogleRegister = async () => {
    try {
      setIsGoogleLoading(true);
      setError(""); // Limpiar errores previos
      console.log("Iniciando registro con Google...");

      const result = await signInWithPopup(auth, googleProvider);
      console.log("Registro con Google exitoso:", result.user.displayName);

      // Mostrar diálogo de selección de rol
      const role = await new Promise<string>((resolve) => {
        const dialog = document.createElement("div");
        dialog.className =
          "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
        dialog.innerHTML = `
          <div class="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 class="text-xl font-semibold mb-4">Selecciona tu rol</h2>
            <select id="roleSelect" class="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm mb-4">
              <option value="emisor">Emisor (Empresa)</option>
              <option value="inversionista">Inversionista/Bonista</option>
            </select>
            <button id="confirmRole" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-full transition">
              Confirmar
            </button>
          </div>
        `;

        document.body.appendChild(dialog);

        const confirmButton = dialog.querySelector("#confirmRole");
        const roleSelect = dialog.querySelector(
          "#roleSelect"
        ) as HTMLSelectElement;

        confirmButton?.addEventListener("click", () => {
          document.body.removeChild(dialog);
          resolve(roleSelect.value);
        });
      });

      // Obtener el nombre completo y dividirlo en nombre y apellido
      const fullName = result.user.displayName || "";
      const nameParts = fullName.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      await saveUserData(result.user, {
        firstName,
        lastName,
        role,
      });

      // Verificar si el rol está vacío en la base de datos
      const userData = await import("@/lib/userUtils").then((m) =>
        m.getUserData(result.user.uid)
      );
      if (!userData?.role) {
        router.push("/select-role");
        return;
      }
      if (role === "emisor") {
        router.push("/emisor/dashboard");
      } else {
        router.push("/inversionista/dashboard");
      }
    } catch (error: unknown) {
      console.error("Error en registro con Google:", error);

      // Manejo específico de errores de popup
      if (error instanceof Error) {
        const errorCode = error.message.split("(")[1]?.split(")")[0];

        if (errorCode === "auth/popup-closed-by-user") {
          setError(
            "La ventana de registro fue cerrada. Haz clic en 'Registrarse con Google' para intentar de nuevo."
          );
        } else if (errorCode === "auth/popup-blocked") {
          setError(
            "Tu navegador bloqueó la ventana emergente. Por favor, permite las ventanas emergentes para este sitio y vuelve a intentar."
          );
        } else if (errorCode === "auth/cancelled-popup-request") {
          setError(
            "Se canceló la solicitud de registro. Puedes intentar de nuevo."
          );
        } else {
          setError(getErrorMessage(error));
        }
      } else {
        setError(getErrorMessage(error));
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-md space-y-4">
        <h2 className="text-center text-xl font-bold text-gray-900">
          Crea tu cuenta
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="firstName"
            placeholder="Nombre"
            value={formData.firstName}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            required
          />
          <input
            type="text"
            name="lastName"
            placeholder="Apellido"
            value={formData.lastName}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Correo electrónico"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            required
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirmar contraseña"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            required
          />
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            required
          >
            <option value="emisor">Emisor (Empresa)</option>
            <option value="inversionista">Inversionista/Bonista</option>
          </select>
          {error && (
            <div className="text-sm text-red-600 bg-red-100 p-2 rounded-md text-center">
              {error}
            </div>
          )}          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium py-2 rounded-full transition flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Registrando...
              </>
            ) : (
              "Registrarse"
            )}
          </button>
        </form>
        <div className="my-4 flex items-center">
          <div className="flex-grow h-px bg-gray-200" />
          <span className="mx-2 text-gray-400 text-xs">o</span>
          <div className="flex-grow h-px bg-gray-200" />
        </div>        <button
          type="button"
          onClick={handleGoogleRegister}
          disabled={isGoogleLoading}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-100 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-700 font-medium py-2 rounded-full transition"
        >
          {isGoogleLoading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Registrando con Google...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <g>
                  <path
                    fill="#4285F4"
                    d="M24 9.5c3.54 0 6.7 1.22 9.19 3.61l6.85-6.85C36.45 2.36 30.7 0 24 0 14.82 0 6.73 5.38 2.69 13.19l7.98 6.2C12.12 13.13 17.62 9.5 24 9.5z"
                  />
                  <path
                    fill="#34A853"
                    d="M46.1 24.55c0-1.64-.15-3.22-.43-4.74H24v9.01h12.41c-.54 2.91-2.18 5.38-4.65 7.04l7.19 5.6C43.93 37.01 46.1 31.32 46.1 24.55z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.67 28.39c-1.08-3.21-1.08-6.67 0-9.88l-7.98-6.2C.89 16.41 0 20.09 0 24c0 3.91.89 7.59 2.69 11.19l7.98-6.2z"
                  />
                  <path
                    fill="#EA4335"
                    d="M24 48c6.7 0 12.45-2.21 16.59-6.01l-7.19-5.6c-2.01 1.35-4.59 2.15-7.4 2.15-6.38 0-11.88-3.63-14.33-8.89l-7.98 6.2C6.73 42.62 14.82 48 24 48z"
                  />
                  <path fill="none" d="M0 0h48v48H0z" />
                </g>
              </svg>
              Registrarse con Google
            </>
          )}
        </button>
        <p className="text-center text-sm text-gray-600">
          ¿Ya tienes una cuenta?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
