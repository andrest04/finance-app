import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { type BonoFormData } from "./types";

export function useUserSettings(
  firebaseUser: { uid: string } | null,
  form: UseFormReturn<BonoFormData>
) {
  const [userCurrency, setUserCurrency] = useState("PEN");

  // Load user settings
  useEffect(() => {
    const loadUserSettings = async () => {
      if (!firebaseUser) return;

      try {
        const settingsRef = doc(
          db,
          "users",
          firebaseUser.uid,
          "settings",
          "preferences"
        );
        const settingsDoc = await getDoc(settingsRef);

        if (settingsDoc.exists()) {
          const settings = settingsDoc.data();
          const currency = settings.currency || "PEN";
          setUserCurrency(currency);
          form.setValue("moneda", currency);
        }
      } catch (error) {
        console.error("Error loading user settings:", error);
      }
    };

    loadUserSettings();
  }, [firebaseUser, form]);

  return { userCurrency, setUserCurrency };
}
