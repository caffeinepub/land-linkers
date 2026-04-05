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
import {
  Card,
  CardContent,
  type CardHeader,
  type CardTitle,
} from "@/components/ui/card";
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
  CalendarDays,
  CheckCircle,
  ImageIcon,
  LogOut,
  MapPin,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { db } from "../utils/firebase";
import type { AppUser, PlotListing } from "../utils/firebaseStore";
import {
  deleteListing,
  deletePlotPhotos,
  deleteUser,
  verifyListing,
} from "../utils/firebaseStore";

const NEW_LOGO = "/assets/image-019d4503-4266-7396-af3a-623deafe0238.png";

export function AdminPage() {
  const { onLogout } = useAuth();

  // ── Strict login wall ──────────────────────────────────────────────────────
  // Read session once on mount — no useEffect that triggers reloads
  const [isAdminAuth] = useState(() => {
    try {
      const raw = localStorage.getItem("ll_admin_session");
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return (
        parsed.role === "admin" &&
        Date.now() - parsed.ts < 7 * 24 * 60 * 60 * 1000
      );
    } catch {
      return false;
    }
  });

  const [plots, setPlots] = useState<PlotListing[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ── Real-time users listener ──────────────────────────────────────────────
  useEffect(() => {
    if (!isAdminAuth) return;
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
        const msg =
          err.code === "permission-denied"
            ? `Permission denied — check Firestore rules for 'users'. Error: ${err.message}`
            : `Firestore error (${err.code}): ${err.message}`;
        toast.error(msg);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [isAdminAuth]);

  // ── Real-time plots listener ──────────────────────────────────────────────
  useEffect(() => {
    if (!isAdminAuth) return;
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
        const msg =
          err.code === "permission-denied"
            ? `Permission denied — check Firestore rules for 'plots'. Error: ${err.message}`
            : `Firestore error (${err.code}): ${err.message}`;
        toast.error(msg);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [isAdminAuth]);

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
      const result = await deleteUser(userId);
      if (result.authDeleted) {
        toast.success("User fully deleted from database and login system.");
      } else {
        toast.success(
          "User removed from database. Phone number is now free to reuse. For email accounts, also remove from Firebase Console → Authentication if needed.",
        );
      }
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

  // If not authenticated, render nothing — App.tsx router already guards this route.
  // No useEffect redirect here to avoid reload loops.
  if (!isAdminAuth) return null;

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
                  <p>No plots found.</p>
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
              ) : realUserCount === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">
                    No users found in the &apos;users&apos; collection.
                  </p>
                  <p className="text-xs mt-1 opacity-70 max-w-sm mx-auto">
                    No accounts have been created yet, or they were saved to a
                    different collection.
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

function UserCard({ user, plotCount, joinedDate, onDelete }: UserCardProps) {
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
                  This will permanently remove the user from the database and
                  free their phone number for reuse. For email accounts, their
                  login access will also be removed automatically if possible.
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

// Suppress unused import warnings for CardHeader/CardTitle (used by parent consumers)
export type { CardHeader, CardTitle };
