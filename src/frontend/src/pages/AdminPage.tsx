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
import { collection, onSnapshot } from "firebase/firestore";
import type { FirestoreError } from "firebase/firestore";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle,
  ImageIcon,
  MapPin,
  RefreshCw,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { db } from "../utils/firebase";
import type { AppUser, PlotListing } from "../utils/firebaseStore";
import {
  deleteListing,
  deletePlotPhotos,
  deleteUser,
  verifyListing,
} from "../utils/firebaseStore";

const NEW_LOGO = "/assets/image-019d4503-4266-7396-af3a-623deafe0238.png";

const CORRECT_FIRESTORE_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /plots/{plotId} {
      allow read: if true;
      allow write: if request.resource.data.keys().hasAny(['ownerName', 'status', 'addedBy']);
    }
    match /plotPhotos/{photoId} {
      allow read: if true;
      allow write: if request.resource.data.keys().hasAll(['photos']);
    }
    match /users/{userId} {
      allow read: if true;
      allow write: if request.resource.data.keys().hasAny(['role', 'lastLogin', 'name', 'loginId', 'email', 'mobile', 'password', 'createdAt']);
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}`;

export function AdminPage() {
  const [plots, setPlots] = useState<PlotListing[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    setRetryKey((k) => k + 1);
  }, []);

  // Real-time users listener
  // biome-ignore lint/correctness/useExhaustiveDependencies: retryKey is intentional trigger
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const usersData = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as AppUser[];
        setUsers(usersData);
        setLoading(false);
      },
      (err: FirestoreError) => {
        let message: string;
        if (err.code === "permission-denied") {
          message =
            "Permission denied: Update Firestore Security Rules to allow reads on the 'users' and 'plots' collections.";
        } else {
          message = err.message || "Failed to load users.";
        }
        toast.error(message);
        setError(message);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [retryKey]);

  // Real-time plots listener
  // biome-ignore lint/correctness/useExhaustiveDependencies: retryKey is intentional trigger
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "plots"),
      (snapshot) => {
        const plotData = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as PlotListing[];
        setPlots(plotData);
      },
      (err: FirestoreError) => {
        let message: string;
        if (err.code === "permission-denied") {
          message =
            "Permission denied: Update Firestore Security Rules to allow reads on the 'plots' collection.";
        } else {
          message = err.message || "Failed to load plots.";
        }
        toast.error(message);
        // Only set error if not already set (users error takes precedence)
        setError((prev) => prev ?? message);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [retryKey]);

  // Compute plot counts per user — keyed by user ID, with email/mobile fallback
  const plotCountByUserId = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const plot of plots) {
      // Primary: match by ownerId (Firestore UID)
      if (plot.ownerId) {
        counts[plot.ownerId] = (counts[plot.ownerId] ?? 0) + 1;
        continue;
      }
      // Fallback: match by ownerEmail against user email / loginId / mobile
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
      // users state will auto-update via onSnapshot
      toast.success(
        "User removed from database. To also remove their login access, delete them from Firebase Console → Authentication.",
      );
    } catch {
      toast.error("Failed to delete user.");
    }
  };

  // Format joined date from createdAt field
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

  // Sorted filtered lists
  const agentUsers = useMemo(() => {
    return [...users.filter((u) => u.role === "agent")].sort(
      (a, b) => (plotCountByUserId[b.id] ?? 0) - (plotCountByUserId[a.id] ?? 0),
    );
  }, [users, plotCountByUserId]);

  const ownerUsers = useMemo(() => {
    return [...users.filter((u) => u.role === "owner")].sort(
      (a, b) => (plotCountByUserId[b.id] ?? 0) - (plotCountByUserId[a.id] ?? 0),
    );
  }, [users, plotCountByUserId]);

  return (
    <main className="bg-background min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Admin Header with logo & branding */}
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
                    (e.currentTarget.parentElement as HTMLElement).innerHTML =
                      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
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
          </div>

          {/* ── Error Banner ── */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
              data-ocid="admin.error_state"
            >
              <Card className="border-destructive/50 bg-destructive/5">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-destructive text-base">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    Data Loading Failed
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-destructive/90">{error}</p>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      Go to{" "}
                      <strong>Firebase Console → Firestore → Rules</strong> and
                      ensure these rules are set:
                    </p>
                    <pre className="bg-muted/60 border border-border rounded-lg p-3 text-xs font-mono overflow-x-auto whitespace-pre leading-relaxed text-foreground/80">
                      {CORRECT_FIRESTORE_RULES}
                    </pre>
                  </div>

                  <div className="pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetry}
                      className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      data-ocid="admin.primary_button"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Retry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <Card data-ocid="admin.card">
              <CardContent className="pt-5 pb-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-serif font-bold text-2xl text-foreground">
                    {users.length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Users
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card data-ocid="admin.card">
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
            <TabsList className="w-full mb-6" data-ocid="admin.tab">
              <TabsTrigger
                value="plots"
                className="flex-1"
                data-ocid="admin.tab"
              >
                Manage Plots ({plots.length})
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="flex-1"
                data-ocid="admin.tab"
              >
                Manage Users ({users.length})
              </TabsTrigger>
            </TabsList>

            {/* ── MANAGE PLOTS ── */}
            <TabsContent value="plots">
              {loading ? (
                <div className="space-y-4" data-ocid="admin.loading_state">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-36 w-full rounded-xl" />
                  ))}
                </div>
              ) : plots.length === 0 ? (
                <div
                  className="text-center py-16 text-muted-foreground"
                  data-ocid="admin.empty_state"
                >
                  <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No plots found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {plots.map((plot, i) => (
                    <Card
                      key={plot.id}
                      data-ocid={`admin.item.${i + 1}`}
                      className="overflow-hidden"
                    >
                      <CardContent className="p-0">
                        <div className="flex flex-col sm:flex-row">
                          {/* Thumbnail */}
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

                          {/* Details */}
                          <div className="flex-1 p-4">
                            <div className="flex flex-wrap items-start gap-2 mb-2">
                              <h3 className="font-semibold text-foreground text-base">
                                {plot.ownerName}
                              </h3>
                              {plot.verified && (
                                <Badge
                                  className="bg-green-100 text-green-700 border-green-200 gap-1"
                                  data-ocid="admin.success_state"
                                >
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
                              {plot.layoutName && (
                                <span>Layout: {plot.layoutName}</span>
                              )}
                              {plot.plotNumber && (
                                <span>Plot #: {plot.plotNumber}</span>
                              )}
                              {plot.ownerEmail && (
                                <span>{plot.ownerEmail}</span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                              {/* Verify Toggle */}
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={plot.verified}
                                  onCheckedChange={() =>
                                    handleToggleVerify(plot)
                                  }
                                  disabled={togglingId === plot.id}
                                  data-ocid="admin.switch"
                                />
                                <span className="text-xs text-muted-foreground">
                                  {togglingId === plot.id
                                    ? "Updating…"
                                    : plot.verified
                                      ? "Verified"
                                      : "Mark Verified"}
                                </span>
                              </div>

                              {/* Delete Button */}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="gap-1.5"
                                    disabled={deletingId === plot.id}
                                    data-ocid={`admin.delete_button.${i + 1}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    {deletingId === plot.id
                                      ? "Deleting…"
                                      : "Delete"}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent data-ocid="admin.dialog">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete this plot?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently remove the plot
                                      listing for{" "}
                                      <strong>{plot.ownerName}</strong> and all
                                      its photos from Firebase. This cannot be
                                      undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel data-ocid="admin.cancel_button">
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeletePlot(plot)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      data-ocid="admin.confirm_button"
                                    >
                                      Yes, Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>

                              {/* Photo link */}
                              {plot.photoLink && (
                                <a
                                  href={plot.photoLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline"
                                  data-ocid="admin.link"
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
                <div className="space-y-3" data-ocid="admin.loading_state">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-xl" />
                  ))}
                </div>
              ) : (
                <Tabs defaultValue="agents">
                  <TabsList className="w-full mb-4" data-ocid="admin.tab">
                    <TabsTrigger
                      value="agents"
                      className="flex-1"
                      data-ocid="admin.tab"
                    >
                      Agents ({agentUsers.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="owners"
                      className="flex-1"
                      data-ocid="admin.tab"
                    >
                      Owners ({ownerUsers.length})
                    </TabsTrigger>
                  </TabsList>

                  {/* Agents Tab */}
                  <TabsContent value="agents">
                    {agentUsers.length === 0 ? (
                      <div
                        className="text-center py-12 text-muted-foreground"
                        data-ocid="admin.empty_state"
                      >
                        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p>No agents found.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {agentUsers.map((user, i) => (
                          <UserCard
                            key={user.id}
                            user={user}
                            plotCount={plotCountByUserId[user.id] ?? 0}
                            joinedDate={formatJoinedDate(user.createdAt)}
                            index={i + 1}
                            onDelete={handleDeleteUser}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Owners Tab */}
                  <TabsContent value="owners">
                    {ownerUsers.length === 0 ? (
                      <div
                        className="text-center py-12 text-muted-foreground"
                        data-ocid="admin.empty_state"
                      >
                        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p>No owners found.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {ownerUsers.map((user, i) => (
                          <UserCard
                            key={user.id}
                            user={user}
                            plotCount={plotCountByUserId[user.id] ?? 0}
                            joinedDate={formatJoinedDate(user.createdAt)}
                            index={i + 1}
                            onDelete={handleDeleteUser}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>
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
  index: number;
  onDelete: (userId: string) => void;
}

function UserCard({
  user,
  plotCount,
  joinedDate,
  index,
  onDelete,
}: UserCardProps) {
  const contactInfo =
    user.email || user.mobile || user.loginId || "No contact info";
  const isAgent = user.role === "agent";

  return (
    <Card
      data-ocid={`admin.item.${index}`}
      className="overflow-hidden border border-border/60 hover:border-border transition-colors"
    >
      <CardContent className="py-4 px-5">
        <div className="flex items-start justify-between gap-4">
          {/* Left: avatar + details */}
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                isAgent
                  ? "bg-blue-100 text-blue-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {user.name
                ? user.name.charAt(0).toUpperCase()
                : isAgent
                  ? "A"
                  : "O"}
            </div>
            <div className="min-w-0 flex-1">
              {/* Name + Role badge */}
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user.name || "—"}
                </p>
                <Badge
                  className={`text-xs px-2 py-0 leading-5 shrink-0 ${
                    isAgent
                      ? "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100"
                      : "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  }`}
                >
                  {isAgent ? "Agent" : "Owner"}
                </Badge>
              </div>

              {/* Email / Phone */}
              <p className="text-xs text-muted-foreground truncate mb-1.5">
                {contactInfo}
              </p>

              {/* Meta row: plots + joined */}
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

          {/* Right: delete button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                data-ocid={`admin.delete_button.${index}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent data-ocid="admin.dialog">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this user?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove the user&apos;s record from the
                  database. To also remove their login access, delete them from
                  Firebase Console → Authentication.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-ocid="admin.cancel_button">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(user.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  data-ocid="admin.confirm_button"
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
