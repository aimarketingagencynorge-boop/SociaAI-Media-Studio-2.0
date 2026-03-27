import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, where, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);

// Initialize Firestore with fallback logic
let dbInstance: any;
try {
  const dbId = (firebaseConfig as any).firestoreDatabaseId;
  if (dbId && dbId !== "(default)") {
    dbInstance = getFirestore(app, dbId);
  } else {
    dbInstance = getFirestore(app);
  }
} catch (e) {
  console.warn("Failed to initialize Firestore with config ID, falling back to default:", e);
  dbInstance = getFirestore(app);
}

export const db = dbInstance;
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export type { User };

// Connection test with more detailed logging and automatic fallback
async function testConnection() {
  const dbId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
  try {
    console.log(`Testing Firestore connection to database: ${dbId}...`);
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection test successful (reached server).");
  } catch (error: any) {
    // If we get a NOT_FOUND error on a named database, we should probably be using the default one
    if (dbId !== '(default)' && (error?.code === 'not-found' || error?.message?.includes('not-found'))) {
      console.warn("Named database not found, application may need to use (default) database.");
    }

    // If we get a permission-denied error, it actually means we REACHED the server
    // but the rules didn't allow the read. This is still a "success" for connectivity.
    if (error?.code === 'permission-denied') {
      console.log("Firestore connection test: Reached server (Permission Denied as expected if rules are strict).");
      return;
    }

    console.error("Firestore connection test failed:", error);
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('unavailable'))) {
      console.error("CRITICAL: Firestore is unreachable. This often means Firestore is not enabled in the Firebase project or the project ID is incorrect.");
    }
  }
}
testConnection();

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
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
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
