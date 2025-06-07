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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(
            docSnap.data() as {
              firstName: string;
              lastName: string;
              role?: string;
            }
          );
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return { firebaseUser, profile };
}
