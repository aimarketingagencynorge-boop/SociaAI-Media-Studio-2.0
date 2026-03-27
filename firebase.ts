import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, where, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);

// Initialize Firestore with a single canonical setup
const dbId = (firebaseConfig as any).firestoreDatabaseId;
export const db = (dbId && dbId !== "(default)") ? getFirestore(app, dbId) : getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export type { User };

// Connection test with diagnostic logging
async function testConnection() {
  const currentDbId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
  const projectId = firebaseConfig.projectId;
  
  console.log(`[Firebase Init] Project: ${projectId}`);
  console.log(`[Firebase Init] Firestore Database: ${currentDbId}`);
  
  try {
    // Attempt a light read to verify connectivity
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("[Firebase Init] Firestore connection test successful.");
  } catch (error: any) {
    // Handle specific error cases without crashing the app
    if (error?.code === 'not-found' || error?.message?.includes('not-found')) {
      console.warn(`[Firebase Init] Firestore database '${currentDbId}' NOT FOUND. Ensure it exists in the Firebase console.`);
    } else if (error?.code === 'permission-denied') {
      console.log("[Firebase Init] Firestore reached (Permission Denied as expected with strict rules).");
    } else if (error?.message?.includes('the client is offline') || error?.message?.includes('unavailable')) {
      console.error("[Firebase Init] Firestore is unreachable. Check network or project configuration.");
    } else {
      console.error("[Firebase Init] Firestore connection test error:", error.message || error);
    }
  }
}

// Start connection test asynchronously
testConnection().then(() => {
  console.log("[Firebase Init] Auth initialization state: ", auth.currentUser ? "Logged In" : "Not Logged In");
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, shouldThrow: boolean = true) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map((provider: any) => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  
  // Log the error with context
  console.error(`[Firestore Error] ${operationType.toUpperCase()} at ${path || 'unknown'}:`, errInfo.error);
  
  if (shouldThrow) {
    throw new Error(JSON.stringify(errInfo));
  }
}
