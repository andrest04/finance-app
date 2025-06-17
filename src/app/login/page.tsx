"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import {
  saveUserData,
  getUserData,
  handleOrphanedUser,
  isUserProfileComplete,
} from "@/lib/userUtils";
import { getErrorMessage } from "@/lib/errorMessages";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log("Attempting login with email:", email);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("Login successful, checking user data");

      // Check if user exists in Firestore and handle orphaned users
      let userData = await getUserData(userCredential.user.uid);

      if (!userData) {
        console.log("User not found in Firestore, handling orphaned user...");
        userData = await handleOrphanedUser(userCredential.user);
      }

      if (!userData) {
        console.error("Failed to create/retrieve user data");
        setError(
          "Error al crear el perfil de usuario. Por favor, contacta al administrador."
        );
        return;
      }

      // Check if user profile is complete
      if (!isUserProfileComplete(userData)) {
        console.log("User profile incomplete, redirecting to role selection");
        router.push("/select-role");
        return;
      }

      // Update last login
      await saveUserData(userCredential.user);

      // Esperar un momento para asegurar que el estado de autenticación se actualice
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (userData.role === "emisor") {
        console.log("Redirecting to emisor dashboard");
        router.push("/emisor/dashboard");
      } else {
        console.log("Redirecting to inversionista dashboard");
        router.push("/inversionista/dashboard");
      }
    } catch (error: unknown) {
      console.error("Login error:", error);
      setError(getErrorMessage(error));
    }
  };
  const handleGoogleLogin = async () => {
    try {
      setError(""); // Limpiar errores previos
      console.log("Iniciando login con Google...");

      const result = await signInWithPopup(auth, googleProvider);
      console.log("Login con Google exitoso:", result.user.displayName);

      // Check if user exists in Firestore and handle orphaned users
      let userData = await getUserData(result.user.uid);

      if (!userData) {
        console.log(
          "Google user not found in Firestore, handling orphaned user..."
        );
        userData = await handleOrphanedUser(result.user);
      }

      if (!userData || !isUserProfileComplete(userData)) {
        console.log(
          "Google user profile incomplete, redirecting to role selection"
        );
        router.push("/select-role");
        return;
      }

      // Update last login
      await saveUserData(result.user);

      if (userData.role === "emisor") {
        router.push("/emisor/dashboard");
      } else {
        router.push("/inversionista/dashboard");
      }
    } catch (error: unknown) {
      console.error("Error en login con Google:", error);

      // Manejo específico de errores de popup
      if (error instanceof Error) {
        const errorCode = error.message.split("(")[1]?.split(")")[0];

        if (errorCode === "auth/popup-closed-by-user") {
          setError(
            "La ventana de inicio de sesión fue cerrada. Haz clic en 'Iniciar sesión con Google' para intentar de nuevo."
          );
        } else if (errorCode === "auth/popup-blocked") {
          setError(
            "Tu navegador bloqueó la ventana emergente. Por favor, permite las ventanas emergentes para este sitio y vuelve a intentar."
          );
        } else if (errorCode === "auth/cancelled-popup-request") {
          setError(
            "Se canceló la solicitud de inicio de sesión. Puedes intentar de nuevo."
          );
        } else {
          setError(getErrorMessage(error));
        }
      } else {
        setError(getErrorMessage(error));
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-md">
        <h2 className="text-center text-xl font-bold text-gray-900 mb-6">
          Inicia sesión en tu cuenta
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            Entrar
          </button>
        </form>
        <div className="my-4 flex items-center">
          <div className="flex-grow h-px bg-gray-200" />
          <span className="mx-2 text-gray-400 text-xs">o</span>
          <div className="flex-grow h-px bg-gray-200" />
        </div>
        <button
          type="button"
          onClick={handleGoogleLogin}
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
          Iniciar sesión con Google
        </button>
        <p className="text-center text-sm text-gray-600 mt-4">
          ¿No tienes una cuenta?{" "}
          <Link href="/register" className="text-blue-600 hover:underline">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
