import { auth, db } from "./firebase";
import { signInWithEmailAndPassword, deleteUser } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { deleteUserData } from "./userUtils";

interface AdminUser {
  uid: string;
  email: string;
  exists_in_firestore: boolean;
  exists_in_auth: boolean;
}

/**
 * Admin function to list all users and their status
 * Note: This requires admin privileges in production
 */
export const listAllUsers = async (): Promise<AdminUser[]> => {
  try {
    console.log("Listing all users...");

    // Get all users from Firestore
    const usersCollection = collection(db, "users");
    const usersSnapshot = await getDocs(usersCollection);
    const firestoreUsers = new Map();

    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      firestoreUsers.set(doc.id, {
        uid: doc.id,
        email: data.email,
        exists_in_firestore: true,
        exists_in_auth: false, // Will be updated if found in Auth
      });
    });

    // Note: In a real production environment, you would need Firebase Admin SDK
    // to list all Firebase Auth users. This is a simplified version.
    console.log("Firestore users found:", firestoreUsers.size);

    return Array.from(firestoreUsers.values());
  } catch (error) {
    console.error("Error listing users:", error);
    throw error;
  }
};

/**
 * Admin function to completely delete a user from both Auth and Firestore
 * WARNING: This permanently deletes all user data
 */
export const completelyDeleteUser = async (
  email: string,
  password: string
): Promise<void> => {
  try {
    console.log("Attempting to completely delete user:", email);

    // First, sign in as the user to get their Auth instance
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Delete from Firestore first
    await deleteUserData(user.uid);

    // Delete from Firebase Auth
    await deleteUser(user);

    console.log("User completely deleted from both Auth and Firestore");
  } catch (error) {
    console.error("Error completely deleting user:", error);
    throw error;
  }
};

/**
 * Admin function to clean orphaned users (exist in Auth but not Firestore)
 * This requires the user's password to delete them from Auth
 */
export const cleanOrphanedUser = async (
  email: string,
  password: string
): Promise<void> => {
  try {
    console.log("Cleaning orphaned user:", email);

    // Sign in as the user
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Delete from Firebase Auth only (since they don't exist in Firestore)
    await deleteUser(user);

    console.log("Orphaned user cleaned from Firebase Auth");
  } catch (error) {
    console.error("Error cleaning orphaned user:", error);
    throw error;
  }
};

/**
 * Generate a cleanup report
 */
export const generateCleanupReport = async (): Promise<string> => {
  try {
    const users = await listAllUsers();

    const report = `
=== FIREBASE USER CLEANUP REPORT ===
Generated: ${new Date().toISOString()}

Total users in Firestore: ${users.length}

Users by status:
${users
  .map(
    (user) =>
      `- ${user.email} (${user.uid}) - Firestore: ${
        user.exists_in_firestore ? "YES" : "NO"
      }`
  )
  .join("\n")}

RECOMMENDATIONS:
1. Users that exist in Auth but not Firestore will be automatically handled by the login system
2. To completely remove a user, use the completelyDeleteUser function with their credentials
3. If you deleted users directly from Firestore, they can recreate their profiles by logging in

=== END REPORT ===
    `;

    console.log(report);
    return report;
  } catch (error) {
    console.error("Error generating cleanup report:", error);
    throw error;
  }
};
