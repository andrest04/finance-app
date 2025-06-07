"use client";

import { useEffect, useState } from "react";
import { auth } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { onAuthStateChanged, User } from "firebase/auth";

export function useCurrentUser() {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{
    firstName: string;
    lastName: string;
    role?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user ? "User logged in" : "No user");
      setFirebaseUser(user);

      if (user) {
        console.log("Fetching user profile for:", user.uid);
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            console.log("User profile found:", docSnap.data());
            setProfile(
              docSnap.data() as {
                firstName: string;
                lastName: string;
                role?: string;
              }
            );
          } else {
            console.log("No user profile found in Firestore");
            setProfile(null);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setProfile(null);
        }
      } else {
        console.log("No user, clearing profile");
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      console.log("Cleaning up auth state listener");
      unsubscribe();
    };
  }, []);

  return { firebaseUser, profile, loading };
}
