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
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    const userData: UserData = {
      email: user.email || "",
      firstName: additionalData?.firstName || "",
      lastName: additionalData?.lastName || "",
      createdAt: userDoc.exists() ? userDoc.data().createdAt : new Date(),
      lastLogin: new Date(),
      provider: user.providerData[0]?.providerId || "email",
      role: additionalData?.role || "inversionista",
    };

    if (!userDoc.exists()) {
      await setDoc(userRef, userData);
    } else {
      await updateDoc(userRef, {
        lastLogin: userData.lastLogin,
        ...additionalData,
      });
    }
  } catch (error) {
    console.error("Error saving user data:", error);
  }
};

export const getUserData = async (userId: string) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }
    return null;
  } catch (error) {
    console.error("Error getting user data:", error);
    return null;
  }
};
