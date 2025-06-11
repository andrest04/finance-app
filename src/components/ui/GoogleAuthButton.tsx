// Enhanced Google Authentication Component with better error handling
"use client";

import { useState, useEffect } from "react";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { getErrorMessage } from "@/lib/errorMessages";

interface GoogleAuthButtonProps {
  onSuccess: (result: any) => void;
  onError: (error: string) => void;
  buttonText?: string;
  className?: string;
  loading?: boolean;
}

export default function GoogleAuthButton({
  onSuccess,
  onError,
  buttonText = "Iniciar sesión con Google",
  className = "",
  loading = false,
}: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showRedirectOption, setShowRedirectOption] = useState(false);

  // Verificar resultado de redirect al cargar el componente
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          onSuccess(result);
        }
      } catch (error) {
        console.error("Error en redirect result:", error);
        onError(getErrorMessage(error));
      }
    };

    checkRedirectResult();
  }, [onSuccess, onError]);

  const handleGoogleAuth = async (useRedirect = false) => {
    try {
      setIsLoading(true);
      setShowRedirectOption(false);

      let result;

      if (useRedirect) {
        // Usar redirección como alternativa
        await signInWithRedirect(auth, googleProvider);
        return; // La redirección se manejará en useEffect
      } else {
        // Intentar con popup primero
        result = await signInWithPopup(auth, googleProvider);
      }

      if (result) {
        onSuccess(result);
      }
    } catch (error: unknown) {
      console.error("Error en autenticación con Google:", error);

      if (error instanceof Error) {
        const errorCode = error.message.split("(")[1]?.split(")")[0];

        // Manejar errores específicos de popup
        if (errorCode === "auth/popup-closed-by-user") {
          setRetryCount((prev) => prev + 1);
          if (retryCount >= 1) {
            setShowRedirectOption(true);
            onError(
              "La ventana fue cerrada varias veces. ¿Quieres probar con redirección?"
            );
          } else {
            onError(
              "La ventana fue cerrada. Intenta de nuevo o usa la opción de redirección."
            );
            setShowRedirectOption(true);
          }
        } else if (errorCode === "auth/popup-blocked") {
          setShowRedirectOption(true);
          onError(
            "Las ventanas emergentes están bloqueadas. Usa la opción de redirección o permite ventanas emergentes."
          );
        } else if (errorCode === "auth/cancelled-popup-request") {
          onError("Se canceló la solicitud. Intenta de nuevo.");
        } else {
          onError(getErrorMessage(error));
        }
      } else {
        onError("Error inesperado. Por favor, intenta de nuevo.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonLoading = loading || isLoading;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => handleGoogleAuth(false)}
        disabled={isButtonLoading}
        className={`w-full flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium py-2 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isButtonLoading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            <span>Autenticando...</span>
          </div>
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
            {buttonText}
          </>
        )}
      </button>

      {showRedirectOption && (
        <button
          type="button"
          onClick={() => handleGoogleAuth(true)}
          disabled={isButtonLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-full transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isButtonLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Redirigiendo...</span>
            </div>
          ) : (
            "Usar redirección (alternativa)"
          )}
        </button>
      )}
    </div>
  );
}
