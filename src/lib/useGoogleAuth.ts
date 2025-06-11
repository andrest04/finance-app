// Custom hook for handling Google authentication with improved error handling
import { useState } from "react";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { saveUserData, getUserData } from "@/lib/userUtils";
import { getErrorMessage } from "@/lib/errorMessages";
import { useRouter } from "next/navigation";

interface UseGoogleAuthOptions {
  onSuccess?: (userData: any) => void;
  onError?: (error: string) => void;
  redirectOnSuccess?: boolean;
}

export const useGoogleAuth = (options: UseGoogleAuthOptions = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const { onSuccess, onError, redirectOnSuccess = true } = options;

  const signInWithGoogle = async (preferRedirect = false) => {
    try {
      setLoading(true);
      setError("");

      let result;

      if (preferRedirect) {
        // Usar redirect como alternativa si popup falla
        await signInWithRedirect(auth, googleProvider);
        return; // El redirect manejará el resto
      } else {
        // Intentar primero con popup
        result = await signInWithPopup(auth, googleProvider);
      }

      if (result) {
        await handleAuthSuccess(result);
      }
    } catch (error: unknown) {
      await handleAuthError(error, preferRedirect);
    } finally {
      setLoading(false);
    }
  };

  const checkRedirectResult = async () => {
    try {
      setLoading(true);
      const result = await getRedirectResult(auth);
      if (result) {
        await handleAuthSuccess(result);
      }
    } catch (error: unknown) {
      handleAuthError(error, false);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = async (result: any) => {
    console.log("Autenticación exitosa:", result.user.displayName);

    await saveUserData(result.user);
    const userData = await getUserData(result.user.uid);

    if (onSuccess) {
      onSuccess(userData);
    } else if (redirectOnSuccess) {
      if (!userData?.role) {
        router.push("/select-role");
        return;
      }

      if (userData.role === "emisor") {
        router.push("/emisor/dashboard");
      } else {
        router.push("/inversionista/dashboard");
      }
    }
  };

  const handleAuthError = async (
    error: unknown,
    wasRedirectAttempt: boolean
  ) => {
    console.error("Error en autenticación:", error);

    if (error instanceof Error) {
      const errorCode = error.message.split("(")[1]?.split(")")[0];

      // Si el popup fue cerrado por el usuario y no hemos intentado redirect, ofrecer redirect
      if (errorCode === "auth/popup-closed-by-user" && !wasRedirectAttempt) {
        setError(
          "La ventana fue cerrada. ¿Quieres intentar con redirección? Haz clic de nuevo en el botón de Google."
        );
        if (onError) onError("popup-closed");
        return;
      }

      // Para otros errores de popup, sugerir redirect
      if (
        (errorCode === "auth/popup-blocked" ||
          errorCode === "auth/cancelled-popup-request") &&
        !wasRedirectAttempt
      ) {
        setError(
          "Hay problemas con ventanas emergentes. Intentando método alternativo..."
        );
        // Automáticamente intentar redirect
        setTimeout(() => {
          signInWithGoogle(true);
        }, 1000);
        return;
      }

      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } else {
      const errorMessage =
        "Ha ocurrido un error inesperado. Por favor, intenta de nuevo.";
      setError(errorMessage);
      if (onError) onError(errorMessage);
    }
  };

  return {
    signInWithGoogle,
    checkRedirectResult,
    loading,
    error,
    setError,
  };
};
