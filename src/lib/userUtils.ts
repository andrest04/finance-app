import { User } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
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
