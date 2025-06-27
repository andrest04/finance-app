import { User } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";

interface UserData {
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
  lastLogin: Date;
  provider: string;
  role: string;
}

export const saveUserData = async (
  user: User,
  additionalData?: Partial<UserData>
) => {
  try {
    console.log("Saving user data for:", user.uid);
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      await updateDoc(userRef, {
        lastLogin: new Date(),
        ...additionalData,
      });
      console.log("User data updated successfully");
      return;
    }

    const userData: UserData = {
      email: user.email || "",
      firstName:
        additionalData?.firstName || user.displayName?.split(" ")[0] || "",
      lastName:
        additionalData?.lastName ||
        user.displayName?.split(" ").slice(1).join(" ") ||
        "",
      createdAt: new Date(),
      lastLogin: new Date(),
      provider: user.providerData[0]?.providerId || "email",
      role: additionalData?.role || "",
    };

    console.log("Creating new user document with data:", userData);
    await setDoc(userRef, userData);
    console.log("User data saved successfully");
  } catch (error) {
    console.error("Error saving user data:", error);
    throw error;
  }
};

export const getUserData = async (userId: string) => {
  try {
    console.log("Getting user data for:", userId);
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      console.log("User data found:", userDoc.data());
      return userDoc.data() as UserData;
    }
    console.log("No user data found for:", userId);
    return null;
  } catch (error) {
    console.error("Error getting user data:", error);
    throw error; // Re-throw the error to handle it in the calling function
  }
};

/**
 * Checks if a user exists in Firestore but not in Firebase Auth
 * and recreates their profile if needed
 */
export const handleOrphanedUser = async (
  user: User
): Promise<UserData | null> => {
  try {
    console.log("Checking for orphaned user:", user.uid);
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.log(
        "User exists in Auth but not in Firestore, recreating profile..."
      );

      // Create a new user profile
      const userData: UserData = {
        email: user.email || "",
        firstName: user.displayName?.split(" ")[0] || "",
        lastName: user.displayName?.split(" ").slice(1).join(" ") || "",
        createdAt: new Date(),
        lastLogin: new Date(),
        provider: user.providerData[0]?.providerId || "email",
        role: "", // Will need to be set later
      };

      await setDoc(userRef, userData);
      console.log("User profile recreated successfully");
      return userData;
    }

    return userDoc.data() as UserData;
  } catch (error) {
    console.error("Error handling orphaned user:", error);
    throw error;
  }
};

/**
 * Forces user profile recreation - useful for admin cleanup
 */
export const recreateUserProfile = async (
  user: User,
  role?: string
): Promise<UserData> => {
  try {
    console.log("Force recreating user profile for:", user.uid);

    const userData: UserData = {
      email: user.email || "",
      firstName: user.displayName?.split(" ")[0] || "",
      lastName: user.displayName?.split(" ").slice(1).join(" ") || "",
      createdAt: new Date(),
      lastLogin: new Date(),
      provider: user.providerData[0]?.providerId || "email",
      role: role || "",
    };

    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, userData, { merge: false }); // Overwrite completely

    console.log("User profile force recreated successfully");
    return userData;
  } catch (error) {
    console.error("Error force recreating user profile:", error);
    throw error;
  }
};

/**
 * Checks if user has complete profile data
 */
export const isUserProfileComplete = (userData: UserData | null): boolean => {
  if (!userData) return false;
  return !!(userData.email && userData.role);
};

/**
 * Clean up user data - removes from Firestore
 */
export const deleteUserData = async (userId: string): Promise<void> => {
  try {
    console.log("Deleting user data from Firestore:", userId);
    const userRef = doc(db, "users", userId);
    await deleteDoc(userRef);
    console.log("User data deleted successfully from Firestore");
  } catch (error) {
    console.error("Error deleting user data:", error);
    throw error;
  }
};
