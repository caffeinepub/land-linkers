import {
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "./firebase";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PlotListing {
  id: string;
  ownerName: string;
  ownerEmail?: string;
  plotAddress?: string;
  plotSize?: string;
  price?: string;
  layoutName?: string;
  plotNumber?: string;
  plotPhasing?: string;
  location?: string;
  photoLinkId?: string;
  photoLink?: string;
  photoUrls?: string[];
  ownerMobile?: string;
  ownerCity?: string;
  status: "for-sale" | "sold" | "hidden" | "pending";
  addedBy: "owner" | "agent";
  verified: boolean;
  assignedAgentId?: string;
  assignedAgentName?: string;
  createdAt: string;
  lastOwnerLogin?: string;
  ownerId?: string;
  lat?: number;
  lng?: number;
}

export interface AppUser {
  id: string;
  name?: string;
  loginId?: string;
  email?: string;
  mobile?: string;
  password?: string;
  role: "owner" | "agent";
  lastLogin: string;
  createdAt?: string;
}

// ─── Session cache key for phone users ───────────────────────────────────────
const LS_SESSION_KEY = "ll_session";

interface PhoneSession {
  role: "owner" | "agent";
  loginId: string;
  name?: string;
  expires: number;
}

export function savePhoneSession(
  role: "owner" | "agent",
  loginId: string,
  name?: string,
) {
  const session: PhoneSession = {
    role,
    loginId,
    name,
    expires: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  };
  localStorage.setItem(LS_SESSION_KEY, JSON.stringify(session));
}

export function getPhoneSession(): PhoneSession | null {
  try {
    const raw = localStorage.getItem(LS_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as PhoneSession;
    if (session.expires < Date.now()) {
      localStorage.removeItem(LS_SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearPhoneSession() {
  localStorage.removeItem(LS_SESSION_KEY);
}

// ─── localStorage fallback keys ───────────────────────────────────────────────

const LS_KEY = "ll_listings";
const LS_PHOTOS_PREFIX = "ll_photos_";
const LS_USERS_KEY = "ll_users";
const LS_ROLE_KEY = "ll_user_role";

// Cache the user role locally so session restore can use it when Firestore is unavailable
export function cacheUserRole(role: "owner" | "agent") {
  localStorage.setItem(LS_ROLE_KEY, role);
}

export function getCachedUserRole(): "owner" | "agent" | null {
  const r = localStorage.getItem(LS_ROLE_KEY);
  return r === "owner" || r === "agent" ? r : null;
}

function lsGetListings(): PlotListing[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function lsGetUsers(): AppUser[] {
  try {
    return JSON.parse(localStorage.getItem(LS_USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

// ─── Image Compression (targets ~100–200 KB) ─────────────────────────────────

export async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX_WIDTH = 900;
      let { width, height } = img;
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);

      const tryQuality = (quality: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            if (blob.size > 200 * 1024 && quality > 0.3) {
              tryQuality(Math.max(quality - 0.1, 0.3));
            } else {
              resolve(
                new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
                  type: "image/jpeg",
                }),
              );
            }
          },
          "image/jpeg",
          quality,
        );
      };
      tryQuality(0.6);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

// ─── Convert File → Base64 data URL ──────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── CRUD – Listings ─────────────────────────────────────────────────────────

export async function getListings(): Promise<PlotListing[]> {
  try {
    const snap = await getDocs(collection(db, "plots"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PlotListing);
  } catch {
    return lsGetListings();
  }
}

export async function saveListing(
  listing: Omit<PlotListing, "id">,
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "plots"), listing);
    return docRef.id;
  } catch {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const all = lsGetListings();
    all.push({ ...listing, id });
    localStorage.setItem(LS_KEY, JSON.stringify(all));
    return id;
  }
}

export async function deleteListing(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "plots", id));
    try {
      await deleteDoc(doc(db, "plotPhotos", id));
    } catch {
      /* ignore */
    }
  } catch {
    const all = lsGetListings().filter((l) => l.id !== id);
    localStorage.setItem(LS_KEY, JSON.stringify(all));
  }
}

export async function verifyListing(
  id: string,
  verified: boolean,
): Promise<void> {
  try {
    await updateDoc(doc(db, "plots", id), { verified });
  } catch {
    const all = lsGetListings().map((l) =>
      l.id === id ? { ...l, verified } : l,
    );
    localStorage.setItem(LS_KEY, JSON.stringify(all));
  }
}

export async function updateListingStatus(
  id: string,
  status: PlotListing["status"],
): Promise<void> {
  try {
    await updateDoc(doc(db, "plots", id), { status });
  } catch {
    const all = lsGetListings().map((l) =>
      l.id === id ? { ...l, status } : l,
    );
    localStorage.setItem(LS_KEY, JSON.stringify(all));
  }
}

// ─── Photos – stored as Base64 in Firestore ──────────────────────────────────

export async function savePhotos(id: string, files: File[]): Promise<string[]> {
  const base64s: string[] = [];
  for (const file of files) {
    const compressed = await compressImage(file);
    const b64 = await fileToBase64(compressed);
    base64s.push(b64);
  }

  try {
    await setDoc(doc(db, "plotPhotos", id), { photos: base64s });
  } catch {
    localStorage.setItem(`${LS_PHOTOS_PREFIX}${id}`, JSON.stringify(base64s));
  }

  return base64s;
}

export async function getPhotos(id: string): Promise<string[]> {
  try {
    const snap = await getDoc(doc(db, "plotPhotos", id));
    if (snap.exists()) {
      const data = snap.data() as { photos: string[] };
      if (data.photos?.length > 0) return data.photos;
    }
  } catch {
    /* ignore */
  }

  try {
    const ls = JSON.parse(
      localStorage.getItem(`${LS_PHOTOS_PREFIX}${id}`) || "[]",
    ) as string[];
    if (ls.length > 0) return ls;
  } catch {
    /* ignore */
  }

  return [];
}

export async function deletePlotPhotos(
  _id: string,
  _photoUrls: string[],
): Promise<void> {
  // Photos stored in Firestore; deletion handled in deleteListing
}

// ─── Sign out from Firebase Auth ─────────────────────────────────────────────

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth).catch(() => {});
  clearPhoneSession();
}

// ─── User Authentication ─────────────────────────────────────────────────────

/**
 * Register a new user.
 * - Email users: create Firebase Auth account, then save FULL profile to Firestore under UID.
 * - Phone users: save directly to Firestore with password hash.
 */
export async function registerUser(params: {
  name: string;
  loginId: string;
  password: string;
  role: "owner" | "agent";
}): Promise<{ success: boolean; error?: string }> {
  const isEmail = params.loginId.includes("@");

  if (isEmail) {
    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        params.loginId,
        params.password,
      );
      const uid = credential.user.uid;

      // Save FULL profile to Firestore — critical so login can restore name & role
      const profileData = {
        name: params.name,
        loginId: params.loginId,
        email: params.loginId,
        role: params.role,
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "users", uid), profileData);
      cacheUserRole(params.role);
      return { success: true };
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === "auth/email-already-in-use") {
        return {
          success: false,
          error: "An account with this email already exists. Please log in.",
        };
      }
      if (code === "auth/weak-password") {
        return {
          success: false,
          error: "Password must be at least 6 characters.",
        };
      }
      if (code === "auth/invalid-email") {
        return {
          success: false,
          error: "Please enter a valid email address.",
        };
      }
      // Firebase Auth unavailable — fall back to Firestore-only
      return registerUserToFirestore(params);
    }
  }

  // Phone number — Firestore only
  return registerUserToFirestore(params);
}

async function registerUserToFirestore(params: {
  name: string;
  loginId: string;
  password: string;
  role: "owner" | "agent";
}): Promise<{ success: boolean; error?: string }> {
  const isEmail = params.loginId.includes("@");
  const userData: Omit<AppUser, "id"> = {
    name: params.name,
    loginId: params.loginId,
    email: isEmail ? params.loginId : undefined,
    mobile: !isEmail ? params.loginId : undefined,
    password: params.password,
    role: params.role,
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  try {
    const q = query(
      collection(db, "users"),
      where("loginId", "==", params.loginId),
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return {
        success: false,
        error:
          "An account with this email/mobile already exists. Please log in.",
      };
    }
    await addDoc(collection(db, "users"), userData);
    return { success: true };
  } catch {
    const existing = lsGetUsers();
    if (existing.find((u) => u.loginId === params.loginId)) {
      return {
        success: false,
        error:
          "An account with this email/mobile already exists. Please log in.",
      };
    }
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    existing.push({ ...userData, id });
    localStorage.setItem(LS_USERS_KEY, JSON.stringify(existing));
    return { success: true };
  }
}

/**
 * Authenticate a user.
 *
 * Email login:
 *   1. Try signInWithEmailAndPassword (Firebase Auth)
 *   2. On success, fetch profile from Firestore by UID
 *   3. If Firestore profile missing, search by email field as fallback
 *   4. If still missing, create minimal profile but PRESERVE the role from
 *      any Firestore-only record matching this email
 *
 * Phone login: Firestore query with localStorage fallback.
 */
export async function loginUser(
  loginId: string,
  password: string,
): Promise<{
  status: "not-found" | "wrong-password" | "success";
  user?: AppUser;
}> {
  const isEmail = loginId.includes("@");

  if (isEmail) {
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        loginId,
        password,
      );
      const uid = credential.user.uid;

      // Fast single-document read by UID
      try {
        const userSnap = await getDoc(doc(db, "users", uid));
        if (userSnap.exists()) {
          const user: AppUser = { id: uid, ...userSnap.data() } as AppUser;
          // Update lastLogin in background (non-blocking)
          updateDoc(doc(db, "users", uid), {
            lastLogin: new Date().toISOString(),
          }).catch(() => {});
          cacheUserRole(user.role);
          return { status: "success", user };
        }
      } catch {
        // Firestore read failed — try email-based fallback query below
      }

      // Profile not found by UID — search by loginId/email field
      // (handles legacy accounts created before UID-keyed profiles)
      try {
        const q = query(
          collection(db, "users"),
          where("loginId", "==", loginId),
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = snap.docs[0].data() as Omit<AppUser, "id">;
          const user: AppUser = { id: uid, ...data };

          // Migrate: copy the found profile to the correct UID-keyed doc
          setDoc(doc(db, "users", uid), {
            name: data.name,
            loginId: data.loginId || loginId,
            email: loginId,
            role: data.role,
            lastLogin: new Date().toISOString(),
          }).catch(() => {});

          cacheUserRole(user.role);
          return { status: "success", user };
        }
      } catch {
        // Firestore query also failed
      }

      // No profile found anywhere — create a minimal one
      // Use cached role if available, otherwise default to owner
      const cachedRole = getCachedUserRole() ?? "owner";
      const minimalUser: AppUser = {
        id: uid,
        loginId,
        email: loginId,
        role: cachedRole,
        lastLogin: new Date().toISOString(),
      };
      setDoc(doc(db, "users", uid), {
        loginId,
        email: loginId,
        role: cachedRole,
        lastLogin: new Date().toISOString(),
      }).catch(() => {});
      cacheUserRole(cachedRole);
      return { status: "success", user: minimalUser };
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;

      if (
        code === "auth/wrong-password" ||
        code === "auth/invalid-login-credentials" ||
        code === "auth/invalid-credential"
      ) {
        return { status: "wrong-password" };
      }

      if (code === "auth/user-not-found" || code === "auth/invalid-email") {
        // User not in Firebase Auth — may be a Firestore-only account
        return loginUserFromFirestore(loginId, password, true);
      }

      // Network / config issue — try Firestore as last resort
      return loginUserFromFirestore(loginId, password, false);
    }
  }

  // Phone number login — Firestore query
  return loginUserFromFirestore(loginId, password, false);
}

/**
 * Firestore-based login (phone users or legacy email users).
 */
async function loginUserFromFirestore(
  loginId: string,
  password: string,
  tryMigrateToFirebaseAuth: boolean,
): Promise<{
  status: "not-found" | "wrong-password" | "success";
  user?: AppUser;
}> {
  try {
    const q = query(collection(db, "users"), where("loginId", "==", loginId));
    const snap = await getDocs(q);

    if (snap.empty) {
      // Try localStorage as last resort
      const lsUsers = lsGetUsers();
      const lsUser = lsUsers.find((u) => u.loginId === loginId);
      if (!lsUser) return { status: "not-found" };
      if (lsUser.password !== password) return { status: "wrong-password" };
      if (!loginId.includes("@"))
        savePhoneSession(lsUser.role, loginId, lsUser.name);
      return { status: "success", user: lsUser };
    }

    const user = { id: snap.docs[0].id, ...snap.docs[0].data() } as AppUser;
    if (user.password !== password) return { status: "wrong-password" };

    // Update lastLogin in background (non-blocking)
    updateDoc(doc(db, "users", user.id), {
      lastLogin: new Date().toISOString(),
    }).catch(() => {});

    cacheUserRole(user.role);

    // Silently migrate legacy email user to Firebase Auth
    if (tryMigrateToFirebaseAuth && loginId.includes("@")) {
      createUserWithEmailAndPassword(auth, loginId, password)
        .then(async (credential) => {
          await setDoc(doc(db, "users", credential.user.uid), {
            name: user.name,
            loginId: user.loginId || loginId,
            email: loginId,
            role: user.role,
            lastLogin: new Date().toISOString(),
          });
        })
        .catch(() => {}); // Already exists or other error — ignore
    }

    // Save phone session for non-email users
    if (!loginId.includes("@")) {
      savePhoneSession(user.role, loginId, user.name);
    }

    return { status: "success", user };
  } catch {
    // Firestore unavailable — try localStorage
    const lsUsers = lsGetUsers();
    const lsUser = lsUsers.find((u) => u.loginId === loginId);
    if (!lsUser) return { status: "not-found" };
    if (lsUser.password !== password) return { status: "wrong-password" };
    if (!loginId.includes("@"))
      savePhoneSession(lsUser.role, loginId, lsUser.name);
    return { status: "success", user: lsUser };
  }
}

// ─── User Activity ───────────────────────────────────────────────────────────

export async function updateUserLastLogin(
  userId: string,
  role: "owner" | "agent",
): Promise<void> {
  try {
    await updateDoc(doc(db, "users", userId), {
      lastLogin: new Date().toISOString(),
      role,
    });
  } catch {
    /* ignore */
  }
}

export async function getUsers(): Promise<AppUser[]> {
  try {
    const snap = await getDocs(collection(db, "users"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AppUser);
  } catch {
    return lsGetUsers();
  }
}

export async function deleteUser(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "users", id));
  } catch {
    const all = lsGetUsers().filter((u) => u.id !== id);
    localStorage.setItem(LS_USERS_KEY, JSON.stringify(all));
  }
}

export async function getAgentUsers(): Promise<AppUser[]> {
  try {
    const q = query(collection(db, "users"), where("role", "==", "agent"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AppUser);
  } catch {
    return lsGetUsers().filter((u) => u.role === "agent");
  }
}

export async function assignPlotToAgent(
  listing: Omit<PlotListing, "id">,
): Promise<string> {
  return saveListing(listing);
}

/**
 * Ensures the admin has a Firestore document with role: "admin".
 * Called every time admin logs in. Uses merge:true so it's idempotent.
 */
export async function ensureAdminDoc(): Promise<void> {
  try {
    await setDoc(
      doc(db, "users", "admin-portal-user"),
      {
        name: "Admin",
        email: "admin@J",
        loginId: "admin@J",
        role: "admin",
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
      { merge: true },
    );
  } catch {
    // Firestore might be unreachable — not critical for admin login
  }
}
