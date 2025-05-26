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
  });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
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
      });
      router.push("/welcome");
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    }
  };
  const handleGoogleRegister = async () => {
    try {
      console.log("Iniciando registro con Google...");
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Registro con Google exitoso:", result.user.displayName);
      await saveUserData(result.user, {
        firstName: result.user.displayName?.split(" ")[0] || "",
        lastName: result.user.displayName?.split(" ").slice(1).join(" ") || "",
      });
      router.push("/welcome");
    } catch (error: unknown) {
      console.error("Error en registro con Google:", error);
      // Mostrar error más detallado para depuración
      if (error instanceof Error) {
        setError(`${getErrorMessage(error)} (${error.name}: ${error.message})`);
      } else {
        setError(getErrorMessage(error));
      }
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
          {error && (
            <div className="text-sm text-red-600 bg-red-100 p-2 rounded-md text-center">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-full transition"
          >
            Registrarse
          </button>
        </form>
        <div className="my-4 flex items-center">
          <div className="flex-grow h-px bg-gray-200" />
          <span className="mx-2 text-gray-400 text-xs">o</span>
          <div className="flex-grow h-px bg-gray-200" />
        </div>
        <button
          type="button"
          onClick={handleGoogleRegister}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium py-2 rounded-full transition"
        >
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
