import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import type { FirestoreError } from "firebase/firestore";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle,
  ImageIcon,
  LogOut,
  MapPin,
  RefreshCw,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { auth, db } from "../utils/firebase";
import type { AppUser, PlotListing } from "../utils/firebaseStore";
import {
  deleteListing,
  deletePlotPhotos,
  deleteUser,
  verifyListing,
} from "../utils/firebaseStore";

// ── Firebase config shown to user for verification ────────────────────────────
const FIREBASE_PROJECT_ID = "land-linkers";
const FIREBASE_APP_ID = "1:111360206242:web:525c889dd3aa447ef73efb";

const NEW_LOGO = "/assets/image-019d4503-4266-7396-af3a-623deafe0238.png";

const CORRECT_FIRESTORE_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if true;
      allow write: if true;
    }
    match /plots/{plotId} {
      allow read: if true;
      allow write: if true;
    }
    match /plotPhotos/{photoId} {
      allow read: if true;
      allow write: if true;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}`;

interface DiagResult {
  status: "ok" | "error" | "loading";
  docCount?: number;
  errorMsg?: string;
  rawDocs?: Array<{ id: string; role: string; email: string; name: string }>;
}

export function AdminPage() {
  const { onLogout } = useAuth();
  const [plots, setPlots] = useState<PlotListing[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [diag, setDiag] = useState<DiagResult>({ status: "loading" });

  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    setDiag({ status: "loading" });
    setRetryKey((k) => k + 1);
  }, []);

  // ── STEP 1: One-time getDocs diagnostic fetch — no variables, hardcoded path ──
  // biome-ignore lint/correctness/useExhaustiveDependencies: retryKey triggers re-run
  useEffect(() => {
    // Verify auth state
    const currentUser = auth.currentUser;
    console.log(
      "[AdminPage DIAG] auth.currentUser:",
      currentUser
        ? currentUser.uid
        : "null (admin uses localStorage session — expected)",
    );
    console.log(
      "[AdminPage DIAG] Firebase projectId:",
      FIREBASE_PROJECT_ID,
      "| appId:",
      FIREBASE_APP_ID,
    );

    // Direct one-time fetch — no onSnapshot, no variables, hardcoded collection name
    getDocs(collection(db, "users"))
      .then((snap) => {
        const rawDocs = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            role: String(data.role ?? "MISSING"),
            email: String(data.email ?? data.loginId ?? "—"),
            name: String(data.name ?? "—"),
          };
        });

        console.log(
          `[AdminPage DIAG] getDocs('users') returned ${snap.docs.length} docs:`,
        );
        for (const doc of rawDocs) {
          console.log(
            `  id=${doc.id.slice(0, 20)}  role=${doc.role}  email=${doc.email}  name=${doc.name}`,
          );
        }

        setDiag({ status: "ok", docCount: snap.docs.length, rawDocs });
      })
      .catch((err: FirestoreError) => {
        const msg = `getDocs error — code: ${err.code ?? "unknown"} | message: ${err.message ?? err}`;
        console.error("[AdminPage DIAG]", msg);
        setDiag({ status: "error", errorMsg: msg });
      });
  }, [retryKey]);

  // ── STEP 2: Real-time users listener — hardcoded collection name 'users' ──
  // biome-ignore lint/correctness/useExhaustiveDependencies: retryKey is intentional trigger
  useEffect(() => {
    // Hardcoded string 'users' — no variables
    const unsub = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        console.log(
          `[AdminPage] onSnapshot('users') fired. Total docs: ${snapshot.docs.length}`,
        );
        for (const d of snapshot.docs) {
          const data = d.data();
          console.log(
            `[AdminPage] user: id=${d.id} role=${data.role ?? "MISSING"} email=${data.email ?? data.loginId ?? "—"} name=${data.name ?? "—"}`,
          );
        }

        const usersData = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as AppUser[];

        setUsers(usersData);
        setLoading(false);
      },
      (err: FirestoreError) => {
        const msg =
          err.code === "permission-denied"
            ? `PERMISSION DENIED — Firestore blocked the read on 'users'. Error: ${err.message}`
            : `Firestore error (${err.code}): ${err.message}`;

        console.error("[AdminPage] onSnapshot error:", msg);
        toast.error(msg);
        setError(msg);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [retryKey]);

  // ── Real-time plots listener — hardcoded collection name 'plots' ──
  // biome-ignore lint/correctness/useExhaustiveDependencies: retryKey is intentional trigger
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "plots"),
      (snapshot) => {
        console.log(
          `[AdminPage] onSnapshot('plots') fired. Total docs: ${snapshot.docs.length}`,
        );
        const plotData = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as PlotListing[];
        setPlots(plotData);
      },
      (err: FirestoreError) => {
        const msg =
          err.code === "permission-denied"
            ? `PERMISSION DENIED — Firestore blocked the read on 'plots'. Error: ${err.message}`
            : `Firestore error (${err.code}): ${err.message}`;

        console.error("[AdminPage] plots onSnapshot error:", msg);
        toast.error(msg);
        setError((prev) => prev ?? msg);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [retryKey]);

  const plotCountByUserId = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const plot of plots) {
      if (plot.ownerId) {
        counts[plot.ownerId] = (counts[plot.ownerId] ?? 0) + 1;
        continue;
      }
      if (plot.ownerEmail) {
        const matchedUser = users.find(
          (u) =>
            (u.email && u.email === plot.ownerEmail) ||
            (u.loginId && u.loginId === plot.ownerEmail) ||
            (u.mobile && u.mobile === plot.ownerEmail),
        );
        if (matchedUser) {
          counts[matchedUser.id] = (counts[matchedUser.id] ?? 0) + 1;
        }
      }
    }
    return counts;
  }, [plots, users]);

  const handleDeletePlot = async (plot: PlotListing) => {
    setDeletingId(plot.id);
    try {
      await Promise.all([
        deleteListing(plot.id),
        deletePlotPhotos(plot.id, plot.photoUrls || []),
      ]);
      toast.success("Plot deleted permanently.");
    } catch {
      toast.error("Failed to delete plot.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleVerify = async (plot: PlotListing) => {
    setTogglingId(plot.id);
    try {
      await verifyListing(plot.id, !plot.verified);
      toast.success(
        plot.verified ? "Verification removed." : "Plot marked as verified!",
      );
    } catch {
      toast.error("Failed to update verification.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
      toast.success(
        "User removed from database. To also remove their login access, delete them from Firebase Console → Authentication.",
      );
    } catch {
      toast.error("Failed to delete user.");
    }
  };

  const formatJoinedDate = (createdAt?: string): string => {
    if (!createdAt) return "—";
    try {
      return new Date(createdAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const allRealUsers = useMemo(
    () =>
      users.filter((u) => u.id !== "admin-portal-user" && u.role !== "admin"),
    [users],
  );

  const agentUsers = useMemo(() => {
    return [...allRealUsers.filter((u) => u.role === "agent")].sort(
      (a, b) => (plotCountByUserId[b.id] ?? 0) - (plotCountByUserId[a.id] ?? 0),
    );
  }, [allRealUsers, plotCountByUserId]);

  const ownerUsers = useMemo(() => {
    return [...allRealUsers.filter((u) => u.role === "owner")].sort(
      (a, b) => (plotCountByUserId[b.id] ?? 0) - (plotCountByUserId[a.id] ?? 0),
    );
  }, [allRealUsers, plotCountByUserId]);

  const unknownRoleUsers = useMemo(
    () => allRealUsers.filter((u) => u.role !== "agent" && u.role !== "owner"),
    [allRealUsers],
  );

  const realUserCount = allRealUsers.length;

  return (
    <main className="bg-background min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Admin Header */}
          <div className="flex items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={NEW_LOGO}
                  alt="Land Linkers logo"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                  }}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-serif font-bold text-3xl text-foreground">
                    Admin Dashboard
                  </h1>
                  <Shield className="w-5 h-5 text-primary opacity-60" />
                </div>
                <p className="text-muted-foreground text-sm">
                  Manage users and plot listings
                </p>
                <p className="text-xs text-muted-foreground/60 italic mt-0.5">
                  Connecting Spaces
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="gap-2 shrink-0 text-muted-foreground hover:text-destructive hover:border-destructive/40"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>

          {/* ── DIAGNOSTIC PANEL — always visible until data loads ── */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card
              className={`border-2 ${
                diag.status === "error"
                  ? "border-red-400 bg-red-50/60 dark:bg-red-950/20"
                  : diag.status === "ok" && (diag.docCount ?? 0) === 0
                    ? "border-orange-400 bg-orange-50/60 dark:bg-orange-950/20"
                    : diag.status === "ok"
                      ? "border-green-400 bg-green-50/60 dark:bg-green-950/20"
                      : "border-amber-300 bg-amber-50/60 dark:bg-amber-950/20"
              }`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono flex items-center gap-2">
                  🔬 Live Firestore Diagnostic
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRetry}
                    className="h-6 px-2 text-xs gap-1 ml-auto"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Retry
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs font-mono space-y-1">
                <p>
                  📁 Collection queried:{" "}
                  <strong className="text-blue-700 dark:text-blue-300">
                    "users"
                  </strong>{" "}
                  (hardcoded string, no variables)
                </p>
                <p>
                  🔥 Firebase Project:{" "}
                  <strong className="text-blue-700 dark:text-blue-300">
                    {FIREBASE_PROJECT_ID}
                  </strong>
                </p>
                <p>
                  🔑 App ID:{" "}
                  <span className="text-gray-600 dark:text-gray-400">
                    {FIREBASE_APP_ID}
                  </span>
                </p>
                <p>
                  👤 auth.currentUser:{" "}
                  <span className="text-orange-600 dark:text-orange-400">
                    null (Admin uses localStorage session — this is expected and
                    OK)
                  </span>
                </p>

                <div className="border-t border-current/20 pt-2 mt-2">
                  {diag.status === "loading" && (
                    <p className="text-amber-700 dark:text-amber-300">
                      ⏳ Fetching from Firestore…
                    </p>
                  )}
                  {diag.status === "error" && (
                    <div className="space-y-1">
                      <p className="text-red-700 dark:text-red-300 font-bold">
                        ❌ FETCH FAILED
                      </p>
                      <p className="text-red-600 dark:text-red-400 break-all">
                        Error: {diag.errorMsg}
                      </p>
                      <p className="text-red-600 dark:text-red-400 mt-2">
                        → Go to Firebase Console → Firestore → Rules and paste
                        the rules below, then click Publish.
                      </p>
                    </div>
                  )}
                  {diag.status === "ok" && (diag.docCount ?? 0) === 0 && (
                    <div className="space-y-1">
                      <p className="text-orange-700 dark:text-orange-300 font-bold">
                        ⚠ Fetch succeeded but returned 0 documents
                      </p>
                      <p className="text-orange-600 dark:text-orange-400">
                        This means the 'users' collection is empty in Firebase
                        project <strong>{FIREBASE_PROJECT_ID}</strong>.
                      </p>
                      <p className="text-orange-600 dark:text-orange-400">
                        → Go to Firebase Console → Firestore Database → Data and
                        check if a 'users' collection exists with documents.
                      </p>
                      <p className="text-orange-600 dark:text-orange-400">
                        → If it shows data there, try signing up a new test
                        account to create a fresh document.
                      </p>
                    </div>
                  )}
                  {diag.status === "ok" && (diag.docCount ?? 0) > 0 && (
                    <div className="space-y-1">
                      <p className="text-green-700 dark:text-green-300 font-bold">
                        ✅ Fetch succeeded —{" "}
                        <strong>{diag.docCount} docs</strong> found in 'users'
                        collection
                      </p>
                      {diag.rawDocs?.map((doc) => (
                        <p
                          key={doc.id}
                          className="text-green-700 dark:text-green-400"
                        >
                          id={doc.id.slice(0, 18)}… | role={doc.role} | email=
                          {doc.email} | name={doc.name}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Error Banner ── */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="border-destructive/50 bg-destructive/5">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-destructive text-base">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    Firestore Read Error
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm font-mono text-destructive/90 break-all">
                    {error}
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      Paste these rules in{" "}
                      <strong>
                        Firebase Console → Firestore Database → Rules
                      </strong>{" "}
                      then click Publish:
                    </p>
                    <pre className="bg-muted/60 border border-border rounded-lg p-3 text-xs font-mono overflow-x-auto whitespace-pre leading-relaxed text-foreground/80">
                      {CORRECT_FIRESTORE_RULES}
                    </pre>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <Card>
              <CardContent className="pt-5 pb-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-serif font-bold text-2xl text-foreground">
                    {realUserCount}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Users
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="font-serif font-bold text-2xl text-foreground">
                    {plots.length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Plots
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="plots">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="plots" className="flex-1">
                Manage Plots ({plots.length})
              </TabsTrigger>
              <TabsTrigger value="users" className="flex-1">
                Manage Users ({realUserCount})
              </TabsTrigger>
            </TabsList>

            {/* ── MANAGE PLOTS ── */}
            <TabsContent value="plots">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-36 w-full rounded-xl" />
                  ))}
                </div>
              ) : plots.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No plots found in the 'plots' collection.</p>
                  <p className="text-xs mt-1 opacity-70">
                    Check the diagnostic panel above for details.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {plots.map((plot) => (
                    <Card key={plot.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex flex-col sm:flex-row">
                          <div className="w-full sm:w-36 h-36 bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                            {plot.photoUrls && plot.photoUrls.length > 0 ? (
                              <img
                                src={plot.photoUrls[0]}
                                alt="Plot thumbnail"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
                            )}
                          </div>
                          <div className="flex-1 p-4">
                            <div className="flex flex-wrap items-start gap-2 mb-2">
                              <h3 className="font-semibold text-foreground text-base">
                                {plot.ownerName}
                              </h3>
                              {plot.verified && (
                                <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Verified
                                </Badge>
                              )}
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  plot.status === "for-sale"
                                    ? "border-green-300 text-green-700"
                                    : plot.status === "sold"
                                      ? "border-gray-300 text-gray-600"
                                      : "border-orange-300 text-orange-700"
                                }`}
                              >
                                {plot.status}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                by {plot.addedBy}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3">
                              {plot.plotAddress && (
                                <span className="flex items-center gap-1 col-span-2">
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  {plot.plotAddress}
                                </span>
                              )}
                              {plot.price && (
                                <span>
                                  ₹ {Number(plot.price).toLocaleString("en-IN")}
                                </span>
                              )}
                              {plot.plotSize && (
                                <span>{plot.plotSize} sq. yd</span>
                              )}
                              {plot.ownerEmail && (
                                <span>{plot.ownerEmail}</span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={plot.verified}
                                  onCheckedChange={() =>
                                    handleToggleVerify(plot)
                                  }
                                  disabled={togglingId === plot.id}
                                />
                                <span className="text-xs text-muted-foreground">
                                  {togglingId === plot.id
                                    ? "Updating…"
                                    : plot.verified
                                      ? "Verified"
                                      : "Mark Verified"}
                                </span>
                              </div>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="gap-1.5"
                                    disabled={deletingId === plot.id}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    {deletingId === plot.id
                                      ? "Deleting…"
                                      : "Delete"}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete this plot?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently remove the plot
                                      listing for{" "}
                                      <strong>{plot.ownerName}</strong> and all
                                      its photos. This cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeletePlot(plot)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Yes, Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              {plot.photoLink && (
                                <a
                                  href={plot.photoLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline"
                                >
                                  View Photos →
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── MANAGE USERS ── */}
            <TabsContent value="users">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-xl" />
                  ))}
                </div>
              ) : realUserCount === 0 && !error ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">
                    No users found in the 'users' collection.
                  </p>
                  <p className="text-xs mt-1 opacity-70 max-w-sm mx-auto">
                    The diagnostic panel above shows exactly what Firestore
                    returned. If it says "0 docs", either no accounts have been
                    created yet, or they were saved to a different collection.
                  </p>
                </div>
              ) : (
                <Tabs
                  defaultValue={
                    agentUsers.length > 0
                      ? "agents"
                      : ownerUsers.length > 0
                        ? "owners"
                        : "all"
                  }
                >
                  <TabsList className="w-full mb-4">
                    <TabsTrigger value="agents" className="flex-1">
                      Agents ({agentUsers.length})
                    </TabsTrigger>
                    <TabsTrigger value="owners" className="flex-1">
                      Owners ({ownerUsers.length})
                    </TabsTrigger>
                    {unknownRoleUsers.length > 0 && (
                      <TabsTrigger value="all" className="flex-1">
                        Other ({unknownRoleUsers.length})
                      </TabsTrigger>
                    )}
                  </TabsList>

                  <TabsContent value="agents">
                    {agentUsers.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p>No agents registered yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {agentUsers.map((user) => (
                          <UserCard
                            key={user.id}
                            user={user}
                            plotCount={plotCountByUserId[user.id] ?? 0}
                            joinedDate={formatJoinedDate(user.createdAt)}
                            onDelete={handleDeleteUser}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="owners">
                    {ownerUsers.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p>No owners registered yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {ownerUsers.map((user) => (
                          <UserCard
                            key={user.id}
                            user={user}
                            plotCount={plotCountByUserId[user.id] ?? 0}
                            joinedDate={formatJoinedDate(user.createdAt)}
                            onDelete={handleDeleteUser}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {unknownRoleUsers.length > 0 && (
                    <TabsContent value="all">
                      <div className="space-y-3">
                        {unknownRoleUsers.map((user) => (
                          <UserCard
                            key={user.id}
                            user={user}
                            plotCount={plotCountByUserId[user.id] ?? 0}
                            joinedDate={formatJoinedDate(user.createdAt)}
                            onDelete={handleDeleteUser}
                          />
                        ))}
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </main>
  );
}

// ─── UserCard sub-component ───────────────────────────────────────────────────

interface UserCardProps {
  user: AppUser;
  plotCount: number;
  joinedDate: string;
  onDelete: (userId: string) => void;
}

function UserCard({
  user,
  plotCount,
  joinedDate,

  onDelete,
}: UserCardProps) {
  const contactInfo =
    user.email || user.mobile || user.loginId || "No contact info";
  const isAgent = user.role === "agent";
  const isOwner = user.role === "owner";

  const badgeClass = isAgent
    ? "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100"
    : isOwner
      ? "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
      : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100";

  const avatarClass = isAgent
    ? "bg-blue-100 text-blue-700"
    : isOwner
      ? "bg-emerald-100 text-emerald-700"
      : "bg-gray-100 text-gray-700";

  return (
    <Card className="overflow-hidden border border-border/60 hover:border-border transition-colors">
      <CardContent className="py-4 px-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarClass}`}
            >
              {user.name
                ? user.name.charAt(0).toUpperCase()
                : isAgent
                  ? "A"
                  : isOwner
                    ? "O"
                    : "?"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user.name || "—"}
                </p>
                <Badge
                  className={`text-xs px-2 py-0 leading-5 shrink-0 ${badgeClass}`}
                >
                  {user.role || "unknown"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate mb-1.5">
                {contactInfo}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span
                  className={`font-medium ${
                    plotCount > 0 ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  Plots: {plotCount}
                </span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" />
                  Joined {joinedDate}
                </span>
              </div>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this user?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove the user&apos;s record from the
                  database. To also remove their login access, delete them from
                  Firebase Console → Authentication.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(user.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Yes, Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

// Keep Dialog import used elsewhere (photo slideshow integration guard)
export { Dialog, DialogContent, DialogHeader, DialogTitle };
