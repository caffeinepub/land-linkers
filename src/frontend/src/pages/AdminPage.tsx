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
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  Home,
  ImageIcon,
  MapPin,
  PlusCircle,
  RefreshCw,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { AppUser, PlotListing } from "../utils/firebaseStore";
import {
  assignPlotToAgent,
  deleteListing,
  deletePlotPhotos,
  deleteUser,
  getAgentUsers,
  getListings,
  getUsers,
  verifyListing,
} from "../utils/firebaseStore";

export function AdminPage() {
  const [plots, setPlots] = useState<PlotListing[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [agentUsers, setAgentUsers] = useState<AppUser[]>([]);
  const [addPlotOpen, setAddPlotOpen] = useState(false);
  const [newPlotAddress, setNewPlotAddress] = useState("");
  const [newPlotPrice, setNewPlotPrice] = useState("");
  const [newPlotSize, setNewPlotSize] = useState("");
  const [newPlotStatus, setNewPlotStatus] = useState<"for-sale" | "pending">(
    "for-sale",
  );
  const [newPlotAgentId, setNewPlotAgentId] = useState("");
  const [isAddingPlot, setIsAddingPlot] = useState(false);

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [plotData, userData, agentData] = await Promise.all([
        getListings(),
        getUsers(),
        getAgentUsers(),
      ]);
      setPlots(plotData);
      setUsers(userData);
      setAgentUsers(agentData);
    } catch {
      toast.error("Failed to load dashboard data.");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Poll every 30 seconds for new users/plots
    const interval = setInterval(() => loadData(false), 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleDeletePlot = async (plot: PlotListing) => {
    setDeletingId(plot.id);
    try {
      await Promise.all([
        deleteListing(plot.id),
        deletePlotPhotos(plot.id, plot.photoUrls || []),
      ]);
      setPlots((prev) => prev.filter((p) => p.id !== plot.id));
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
      setPlots((prev) =>
        prev.map((p) =>
          p.id === plot.id ? { ...p, verified: !p.verified } : p,
        ),
      );
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
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success("User deleted.");
    } catch {
      toast.error("Failed to delete user.");
    }
  };

  const handleAddPlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlotAddress.trim()) {
      toast.error("Please enter a plot address.");
      return;
    }
    setIsAddingPlot(true);
    try {
      const selectedAgent = agentUsers.find((a) => a.id === newPlotAgentId);
      await assignPlotToAgent({
        ownerName: "Admin",
        plotAddress: newPlotAddress.trim(),
        price: newPlotPrice.trim(),
        plotSize: newPlotSize.trim(),
        status: newPlotStatus,
        addedBy: "agent",
        verified: true,
        createdAt: new Date().toISOString(),
        assignedAgentId: newPlotAgentId || undefined,
        assignedAgentName:
          selectedAgent?.name || selectedAgent?.loginId || undefined,
      });
      toast.success("Plot added and assigned to agent.");
      setAddPlotOpen(false);
      setNewPlotAddress("");
      setNewPlotPrice("");
      setNewPlotSize("");
      setNewPlotAgentId("");
      // Reload plots
      const plotData = await getListings();
      setPlots(plotData);
    } catch {
      toast.error("Failed to add plot.");
    } finally {
      setIsAddingPlot(false);
    }
  };

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
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="font-serif font-bold text-3xl text-foreground">
                  Admin Dashboard
                </h1>
                <p className="text-muted-foreground text-sm">
                  Manage users and plot listings
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => loadData()}
                data-ocid="admin.secondary_button"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <Dialog open={addPlotOpen} onOpenChange={setAddPlotOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    data-ocid="admin.open_modal_button"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Add New Plot
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md" data-ocid="admin.dialog">
                  <DialogHeader>
                    <DialogTitle className="font-serif">
                      Add New Plot
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddPlot} className="space-y-4 mt-2">
                    <div>
                      <Label htmlFor="np-address">Plot Address *</Label>
                      <Input
                        id="np-address"
                        value={newPlotAddress}
                        onChange={(e) => setNewPlotAddress(e.target.value)}
                        placeholder="Enter full plot address"
                        className="mt-1"
                        data-ocid="admin.input"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="np-price">Price (₹)</Label>
                        <Input
                          id="np-price"
                          value={newPlotPrice}
                          onChange={(e) => setNewPlotPrice(e.target.value)}
                          placeholder="e.g. 500000"
                          className="mt-1"
                          data-ocid="admin.input"
                        />
                      </div>
                      <div>
                        <Label htmlFor="np-size">Plot Size</Label>
                        <Input
                          id="np-size"
                          value={newPlotSize}
                          onChange={(e) => setNewPlotSize(e.target.value)}
                          placeholder="e.g. 200 sq.yd"
                          className="mt-1"
                          data-ocid="admin.input"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select
                        value={newPlotStatus}
                        onValueChange={(v) =>
                          setNewPlotStatus(v as "for-sale" | "pending")
                        }
                      >
                        <SelectTrigger
                          className="mt-1"
                          data-ocid="admin.select"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="for-sale">For Sale</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Assign to Agent</Label>
                      <Select
                        value={newPlotAgentId}
                        onValueChange={setNewPlotAgentId}
                      >
                        <SelectTrigger
                          className="mt-1"
                          data-ocid="admin.select"
                        >
                          <SelectValue placeholder="Select an agent (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {agentUsers.map((agent) => (
                            <SelectItem key={agent.id} value={agent.id}>
                              {agent.name ||
                                agent.loginId ||
                                agent.email ||
                                agent.id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setAddPlotOpen(false)}
                        data-ocid="admin.cancel_button"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isAddingPlot}
                        data-ocid="admin.submit_button"
                      >
                        {isAddingPlot ? "Adding..." : "Add Plot"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              <a
                href="/"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted text-sm font-medium text-foreground transition-colors"
                data-ocid="admin.link"
              >
                <Home className="w-4 h-4" />
                Home
              </a>
            </div>
          </div>

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
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
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
                      Agents ({users.filter((u) => u.role === "agent").length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="owners"
                      className="flex-1"
                      data-ocid="admin.tab"
                    >
                      Owners ({users.filter((u) => u.role === "owner").length})
                    </TabsTrigger>
                  </TabsList>
                  {(["agents", "owners"] as const).map((tab) => {
                    const role = tab === "agents" ? "agent" : "owner";
                    const filtered = users.filter((u) => u.role === role);
                    return (
                      <TabsContent key={tab} value={tab}>
                        {filtered.length === 0 ? (
                          <div
                            className="text-center py-12 text-muted-foreground"
                            data-ocid="admin.empty_state"
                          >
                            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p>No {tab} found.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {filtered.map((user, i) => (
                              <Card
                                key={user.id}
                                data-ocid={`admin.item.${i + 1}`}
                              >
                                <CardContent className="py-4 px-5 flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                                      {user.role === "owner" ? "🏠" : "🤝"}
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold text-foreground">
                                        {user.name || "—"}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {user.email ||
                                          user.mobile ||
                                          user.loginId ||
                                          "No contact info"}
                                      </p>
                                      <p className="text-xs text-muted-foreground capitalize">
                                        {user.role} ·{" "}
                                        {user.lastLogin
                                          ? `Last login: ${new Date(user.lastLogin).toLocaleDateString()}`
                                          : "Never logged in"}
                                      </p>
                                    </div>
                                  </div>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        className="gap-1.5 shrink-0"
                                        data-ocid={`admin.delete_button.${i + 1}`}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Delete
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent data-ocid="admin.dialog">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Delete this user?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will permanently remove the user
                                          record from the database. Their plot
                                          listings will remain unless deleted
                                          separately.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel data-ocid="admin.cancel_button">
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() =>
                                            handleDeleteUser(user.id)
                                          }
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          data-ocid="admin.confirm_button"
                                        >
                                          Yes, Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </TabsContent>
                    );
                  })}
                </Tabs>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </main>
  );
}
