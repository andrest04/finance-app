"use client";

import { useEffect, useState, useCallback } from "react";
import { auth } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { onAuthStateChanged, User } from "firebase/auth";

export function useCurrentUser() {
  const [state, setState] = useState<{
    firebaseUser: User | null;
    profile: {
      firstName: string;
      lastName: string;
      role?: string;
    } | null;
    loading: boolean;
  }>({
    firebaseUser: null,
    profile: null,
    loading: true,
  });

  const fetchUserProfile = useCallback(async (user: User) => {
    try {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setState((prev) => ({
          ...prev,
          profile: docSnap.data() as {
            firstName: string;
            lastName: string;
            role?: string;
          },
          loading: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          profile: null,
          loading: false,
        }));
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setState((prev) => ({
        ...prev,
        profile: null,
        loading: false,
      }));
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setState((prev) => ({
          ...prev,
          firebaseUser: user,
          loading: true,
        }));
        await fetchUserProfile(user);
      } else {
        setState({
          firebaseUser: null,
          profile: null,
          loading: false,
        });
      }
    });

    return () => unsubscribe();
  }, [fetchUserProfile]);

  return state;
}
