// db-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyDGSSNs6k8VbdCgkTBlO82t3dB13EKL0ns",
  authDomain: "calender-fzoooi.firebaseapp.com",
  projectId: "calender-fzoooi",
  storageBucket: "calender-fzoooi.firebasestorage.app",
  messagingSenderId: "776889435651",
  appId: "1:776889435651:web:3a1c36f67df3c33b8bf036"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

const SESSION_KEY = "nova_firebase_active_user_v1";

export function getActiveUser() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setActiveUser(user) {
  try {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  } catch {}
}

export async function registerUser({ name, identifier }) {
  const cleanId = String(identifier || "").trim().toLowerCase();
  const cleanName = String(name || "").trim();

  if (!cleanId) {
    throw new Error("Username atau email wajib diisi.");
  }

  const usersRef = collection(db, "users");
  const q = query(usersRef, where("identifier", "==", cleanId), limit(1));
  const existingSnap = await getDocs(q);

  if (!existingSnap.empty) {
    throw new Error("Akun/identitas tersebut sudah terdaftar di database.");
  }

  const userId = "usr_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
  const newUser = {
    id: userId,
    name: cleanName || cleanId,
    identifier: cleanId,
    createdAt: new Date().toISOString()
  };

  await setDoc(doc(db, "users", userId), newUser);
  return newUser;
}

export async function loginUserWithoutPassword(identifier) {
  const cleanId = String(identifier || "").trim().toLowerCase();
  if (!cleanId) {
    throw new Error("Masukkan username atau email terlebih dahulu.");
  }

  const usersRef = collection(db, "users");
  const q = query(usersRef, where("identifier", "==", cleanId), limit(1));
  const snap = await getDocs(q);

  if (snap.empty) {
    throw new Error("User belum terdaftar. Silakan daftar di halaman Register.");
  }

  const userDoc = snap.docs[0].data();
  setActiveUser(userDoc);
  return userDoc;
}

export async function getUserSchedules(userId, defaultSchedules = []) {
  if (!userId) return [];

  const schedDocRef = doc(db, "schedules", userId);
  const snap = await getDoc(schedDocRef);

  if (!snap.exists()) {
    await setDoc(schedDocRef, {
      userId,
      items: defaultSchedules,
      updatedAt: new Date().toISOString()
    });
    return defaultSchedules;
  }

  const data = snap.data();
  return Array.isArray(data?.items) ? data.items : [];
}

export async function saveUserSchedules(userId, schedules) {
  if (!userId) return;

  const schedDocRef = doc(db, "schedules", userId);
  await setDoc(
    schedDocRef,
    {
      userId,
      items: Array.isArray(schedules) ? schedules : [],
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );
}
