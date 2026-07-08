import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Simple connection test
export async function testConnection() {
  try {
    // Attempt a light check
    await getDocFromServer(doc(db, "settings", "store"));
    console.log("Firebase connected successfully");
  } catch (error) {
    console.warn("Firebase connection warning:", error);
  }
}

export default app;
