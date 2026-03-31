import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Camera,
  Check,
  ChevronDown,
  Copy,
  ImageIcon,
  Loader2,
  Mail,
  Map as MapIcon,
  MapPin,
  Phone,
  PlusCircle,
  Search,
  Trash2,
  Upload,
  User,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import PlotMapPicker from "../components/PlotMapPicker";
import { useAuth } from "../context/AuthContext";
import { auth } from "../utils/firebase";
import {
  compressImage,
  getListings,
  saveListing,
  savePhotos,
  updateListingStatus,
} from "../utils/firebaseStore";
import type { PlotListing } from "../utils/firebaseStore";

export function AgentPage() {
  const { userName, userLoginId, userCreatedAt } = useAuth();
  const [listings, setListings] = useState<PlotListing[]>([]);
  const [userCity, setUserCity] = useState<string>("Locating...");
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [salesListOpen, setSalesListOpen] = useState(false);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [locationSavedCoords, setLocationSavedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isLocationGeocoding, setIsLocationGeocoding] = useState(false);
  const [locationMapCenter, setLocationMapCenter] = useState<[number, number]>([
    20.5937, 78.9629,
  ]);

  const [ownerName, setOwnerName] = useState("");
  const [plotPhasing, setPlotPhasing] = useState("");
  const [location, setLocation] = useState("");
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [confirmedPhotoLink, setConfirmedPhotoLink] = useState<string | null>(
    null,
  );
  const [confirmedPhotoLinkId, setConfirmedPhotoLinkId] = useState<
    string | null
  >(null);
  const [confirmedPhotoUrls, setConfirmedPhotoUrls] = useState<string[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Nearby Leads
  const [leadsCity, setLeadsCity] = useState("");
  const [selectedLead, setSelectedLead] = useState<PlotListing | null>(null);
  const [leadDetailOpen, setLeadDetailOpen] = useState(false);
  const [plotDetailOpen, setPlotDetailOpen] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState<PlotListing | null>(null);
  const [nearbyLeadsOpen, setNearbyLeadsOpen] = useState(false);

  // Graph tab toggle
  const [graphTab, setGraphTab] = useState<"sold" | "map">("sold");

  // Map refs for plot pins
  const plotMapRef = useRef<HTMLDivElement>(null);
  const plotLeafletRef = useRef<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getListings().then((allListings) => {
      const uid = auth.currentUser?.uid;
      const myPlots = allListings.filter(
        (p) =>
          p.addedBy === "agent" &&
          (!p.assignedAgentId || p.assignedAgentId === uid),
      );
      const assignedPlots = allListings.filter(
        (p) => p.assignedAgentId === uid,
      );
      const merged = [
        ...new Map(
          [...myPlots, ...assignedPlots].map((p) => [p.id, p]),
        ).values(),
      ];
      setListings(merged);
    });
  }, []);

  // GPS location effect
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            );
            const data = await res.json();
            const city =
              data.address?.city ||
              data.address?.town ||
              data.address?.village ||
              data.address?.county ||
              "Unknown";
            const state = data.address?.state || "";
            setUserCity(state ? `${city}, ${state}` : city);
          } catch {
            setUserCity("Location unavailable");
          }
        },
        () => setUserCity("Location unavailable"),
      );
    } else {
      setUserCity("Location unavailable");
    }
  }, []);

  // Plot map pins effect
  useEffect(() => {
    if (graphTab !== "map") return;
    const timer = setTimeout(() => {
      if (!plotMapRef.current) return;
      if (plotLeafletRef.current) {
        plotLeafletRef.current.remove();
        plotLeafletRef.current = null;
      }
      // Try both import styles
      let L: any;
      try {
        L = (window as any).L || require("leaflet");
      } catch {
        L = (window as any).L;
      }
      if (!L) return;
      const map = L.map(plotMapRef.current).setView([20.5937, 78.9629], 5);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "\u00a9 OpenStreetMap contributors",
      }).addTo(map);

      const plotsWithCoords = listings.filter((l) => l.lat && l.lng);
      for (const plot of plotsWithCoords) {
        const marker = L.marker([plot.lat, plot.lng]).addTo(map);
        marker.bindPopup(
          `<strong>${plot.ownerName || "Plot"}</strong><br/>${plot.location || ""}<br/>Status: ${plot.status}`,
        );
      }

      if (plotsWithCoords.length > 0) {
        const bounds = L.latLngBounds(
          plotsWithCoords.map((p) => [p.lat, p.lng]),
        );
        map.fitBounds(bounds, { padding: [30, 30] });
      }

      plotLeafletRef.current = map;
    }, 100);
    return () => clearTimeout(timer);
  }, [graphTab, listings]);

  const forSaleListings = listings.filter((l) => l.status === "for-sale");
  const soldListings = listings.filter((l) => l.status === "sold");
  const uploadedForSales = listings.filter((l) => l.addedBy === "agent").length;

  // Dynamic chart data
  const dynamicChartData = useMemo(() => {
    const months: Record<
      string,
      { month: string; sold: number; uploaded: number }
    > = {};
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    for (const l of listings) {
      if (!l.createdAt) return;
      const d = new Date(l.createdAt);
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
      if (!months[key]) months[key] = { month: label, sold: 0, uploaded: 0 };
      if (l.status === "sold") months[key].sold++;
      else months[key].uploaded++;
    }

    const sorted = Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);

    if (sorted.length === 0) {
      const now = new Date();
      return Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
        return { month: `${monthNames[d.getMonth()]}`, sold: 0, uploaded: 0 };
      });
    }
    return sorted;
  }, [listings]);

  const handleFilesAdded = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPendingImages((prev) => [...prev, ...Array.from(e.target.files!)]);
      e.target.value = "";
    }
  };

  const handleDeleteImage = (idx: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleConfirmPhotos = async () => {
    if (pendingImages.length === 0) return;
    setIsConfirming(true);
    try {
      const id =
        Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const compressedFiles = await Promise.all(
        pendingImages.map(compressImage),
      );
      const urls = await savePhotos(id, compressedFiles);
      const link = `/photos/${id}`;
      setConfirmedPhotoLink(link);
      setConfirmedPhotoLinkId(id);
      setConfirmedPhotoUrls(urls);
      setPendingImages([]);
      toast.success("Photos confirmed! Link generated.");
    } catch {
      toast.error("Failed to process photos.");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleViewLocationOnMap = async () => {
    if (!location.trim()) {
      toast.warning("Please enter an address first");
      return;
    }
    setIsLocationGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`,
        { headers: { "Accept-Language": "en" } },
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = Number.parseFloat(data[0].lat);
        const lng = Number.parseFloat(data[0].lon);
        setLocationMapCenter([lat, lng]);
      } else {
        toast.error("Address not found. Try a more specific address.");
      }
    } catch {
      toast.error("Failed to search address. Check your connection.");
    } finally {
      setIsLocationGeocoding(false);
    }
  };

  const handleMarkAsSold = async (listingId: string) => {
    try {
      await updateListingStatus(listingId, "sold");
      setListings((prev) =>
        prev.map((l) => (l.id === listingId ? { ...l, status: "sold" } : l)),
      );
      toast.success("Plot marked as sold!");
    } catch {
      toast.error("Failed to update status.");
    }
  };

  const handleSubmitPlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newListing: Omit<PlotListing, "id"> = {
        ownerName,
        plotPhasing,
        location,
        photoLinkId: confirmedPhotoLinkId ?? undefined,
        photoLink: confirmedPhotoLink ?? undefined,
        photoUrls: confirmedPhotoUrls,
        status: "for-sale",
        addedBy: "agent",
        verified: false,
        createdAt: new Date().toISOString(),
        ...(locationSavedCoords
          ? { lat: locationSavedCoords.lat, lng: locationSavedCoords.lng }
          : {}),
      };
      const id = await saveListing(newListing);
      setListings((prev) => [...prev, { ...newListing, id }]);
      setFormOpen(false);
      toast.success("Plot listed successfully!");
      setOwnerName("");
      setPlotPhasing("");
      setLocation("");
      setPendingImages([]);
      setConfirmedPhotoLink(null);
      setConfirmedPhotoLinkId(null);
      setConfirmedPhotoUrls([]);
      setLocationSavedCoords(null);
    } catch {
      toast.error("Failed to list plot. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Agent Details Banner */}
          <Collapsible
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
            className="mb-8"
          >
            <Card data-ocid="agent.card" className="border-primary/20">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="w-full"
                  data-ocid="agent.panel"
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <CardTitle className="font-serif text-lg text-foreground">
                          {userName || "Agent"}
                        </CardTitle>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-muted-foreground transition-transform ${detailsOpen ? "rotate-180" : ""}`}
                    />
                  </CardHeader>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 pb-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {userLoginId?.includes("@") ? (
                        <Mail className="w-4 h-4 text-primary shrink-0" />
                      ) : (
                        <Phone className="w-4 h-4 text-primary shrink-0" />
                      )}
                      <span>{userLoginId || "\u2014"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4 text-primary shrink-0" />
                      <span>{userCity}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4 text-primary shrink-0" />
                      <span>
                        {userCreatedAt
                          ? `Joined ${new Date(userCreatedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`
                          : "\u2014"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
            <div>
              <h1 className="font-serif font-bold text-3xl text-foreground">
                Agent Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your plots and track sales performance
              </p>
            </div>
            <Dialog
              open={formOpen}
              onOpenChange={(open) => {
                setFormOpen(open);
                if (!open) {
                  setPendingImages([]);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  className="bg-primary hover:bg-primary/90 text-white font-semibold gap-2"
                  data-ocid="agent.open_modal_button"
                >
                  <PlusCircle className="w-4 h-4" />
                  Sell a Plot
                </Button>
              </DialogTrigger>
              <DialogContent
                className="max-w-lg max-h-[90vh] overflow-y-auto"
                data-ocid="agent.dialog"
              >
                <DialogHeader>
                  <DialogTitle className="font-serif text-xl">
                    List a New Plot
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmitPlot} className="space-y-4 mt-2">
                  <div>
                    <label
                      htmlFor="agent-owner-name"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Owner Name
                    </label>
                    <input
                      id="agent-owner-name"
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="Enter owner name"
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      data-ocid="agent.input"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="agent-plot-phasing"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Plot Phasing
                    </label>
                    <input
                      id="agent-plot-phasing"
                      type="text"
                      value={plotPhasing}
                      onChange={(e) => setPlotPhasing(e.target.value)}
                      placeholder="e.g. Phase 1, Phase 2"
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      data-ocid="agent.input"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="agent-location"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Location
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="agent-location"
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Enter plot location"
                        className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        data-ocid="agent.input"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleViewLocationOnMap}
                        disabled={isLocationGeocoding}
                        className="gap-1 shrink-0"
                        data-ocid="agent.secondary_button"
                      >
                        {isLocationGeocoding ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <MapPin className="w-4 h-4" />
                        )}
                        {isLocationGeocoding ? "..." : "Search"}
                      </Button>
                    </div>
                    <div className="mt-3" style={{ height: "280px" }}>
                      <PlotMapPicker
                        center={locationMapCenter}
                        pinnedCoords={locationSavedCoords}
                        onPin={(coords) => setLocationSavedCoords(coords)}
                      />
                    </div>
                    {locationSavedCoords && (
                      <span className="inline-flex items-center gap-1.5 text-xs bg-green-100 text-green-700 border border-green-200 rounded-full px-3 py-1 font-medium mt-2">
                        <MapPin className="w-3 h-3" />
                        \uD83D\uDCCD Pinned:{" "}
                        {locationSavedCoords.lat.toFixed(5)},{" "}
                        {locationSavedCoords.lng.toFixed(5)}
                      </span>
                    )}
                  </div>

                  {/* Image Upload with staging */}
                  <div>
                    <div className="block text-sm font-medium text-foreground mb-2">
                      Plot Images
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
                        data-ocid="agent.upload_button"
                      >
                        <ImageIcon className="w-7 h-7 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground font-medium">
                          Upload Images
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
                        data-ocid="agent.camera_button"
                      >
                        <Camera className="w-7 h-7 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground font-medium">
                          Click Picture
                        </span>
                      </button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleFilesAdded}
                    />
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleFilesAdded}
                    />

                    {pendingImages.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-2">
                          Review photos ({pendingImages.length} selected):
                        </p>
                        <div className="grid grid-cols-4 gap-2">
                          {pendingImages.map((file, i) => (
                            <div
                              key={`${file.name}-${i}`}
                              className="aspect-square rounded-lg overflow-hidden border border-border bg-muted relative"
                              data-ocid={`agent.item.${i + 1}`}
                            >
                              <img
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteImage(i)}
                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors shadow-md"
                                title="Delete photo"
                                data-ocid="agent.delete_button"
                              >
                                <span className="text-xs font-bold leading-none">
                                  \u2715
                                </span>
                              </button>
                            </div>
                          ))}
                        </div>
                        <Button
                          type="button"
                          onClick={handleConfirmPhotos}
                          disabled={isConfirming}
                          className="mt-3 bg-green-600 hover:bg-green-700 text-white font-semibold gap-2 w-full"
                          data-ocid="agent.confirm_button"
                        >
                          {isConfirming ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          {isConfirming
                            ? "Compressing & Saving..."
                            : "Confirm Photos"}
                        </Button>
                      </div>
                    )}

                    {confirmedPhotoLink && (
                      <div className="mt-3 p-2.5 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs font-medium text-green-800 mb-1.5">
                          \u2713 Photos confirmed ({confirmedPhotoUrls.length})
                        </p>
                        <div className="flex items-center gap-2">
                          <a
                            href={confirmedPhotoLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-xs text-green-700 font-mono bg-green-100 rounded px-2 py-1 truncate hover:underline"
                            data-ocid="agent.link"
                          >
                            {window.location.origin}
                            {confirmedPhotoLink}
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                window.location.origin + confirmedPhotoLink,
                              );
                              toast.success("Link copied!");
                            }}
                            className="p-1.5 rounded hover:bg-green-200 text-green-700"
                            data-ocid="agent.secondary_button"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFormOpen(false)}
                      data-ocid="agent.cancel_button"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-primary hover:bg-primary/90 text-white"
                      data-ocid="agent.submit_button"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                      ) : null}
                      {isSubmitting ? "Listing..." : "List Plot"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            {/* Uploaded for Sales - clickable */}
            <Dialog open={salesListOpen} onOpenChange={setSalesListOpen}>
              <DialogTrigger asChild>
                <Card
                  data-ocid="agent.card"
                  className="cursor-pointer hover:shadow-md transition-shadow"
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Uploaded for Sales
                    </CardTitle>
                    <Upload className="w-5 h-5 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="font-serif font-bold text-4xl text-foreground">
                      {uploadedForSales}
                    </div>
                    <p className="text-muted-foreground text-xs mt-1">
                      Click to view all listed plots
                    </p>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent
                className="max-w-2xl max-h-[80vh] overflow-y-auto"
                data-ocid="agent.dialog"
              >
                <DialogHeader>
                  <DialogTitle className="font-serif text-xl">
                    Plot Listings
                  </DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="for-sale" className="mt-4">
                  <TabsList className="w-full">
                    <TabsTrigger
                      value="for-sale"
                      className="flex-1"
                      data-ocid="agent.tab"
                    >
                      For Sale ({forSaleListings.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="sold"
                      className="flex-1"
                      data-ocid="agent.tab"
                    >
                      Sold ({soldListings.length})
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="for-sale" className="mt-4 space-y-3">
                    {forSaleListings.length === 0 ? (
                      <p
                        className="text-center text-muted-foreground py-8"
                        data-ocid="agent.empty_state"
                      >
                        No plots listed for sale yet.
                      </p>
                    ) : (
                      forSaleListings.map((listing, i) => (
                        <div
                          key={listing.id}
                          className="border border-border rounded-lg p-3"
                          data-ocid={`agent.item.${i + 1}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-sm text-foreground">
                                {listing.ownerName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {listing.location ||
                                  listing.plotAddress ||
                                  "Location not set"}
                              </p>
                              {listing.plotPhasing && (
                                <p className="text-xs text-muted-foreground">
                                  {listing.plotPhasing}
                                </p>
                              )}
                            </div>
                            <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 whitespace-nowrap">
                              For Sale
                            </span>
                          </div>
                          <div className="flex gap-2 mt-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 px-2"
                              onClick={() => {
                                setSelectedPlot(listing);
                                setSalesListOpen(false);
                                setPlotDetailOpen(true);
                              }}
                              data-ocid="agent.secondary_button"
                            >
                              View Plot Details
                            </Button>
                            <Button
                              size="sm"
                              className="text-xs h-7 px-2 bg-orange-500 hover:bg-orange-600 text-white"
                              onClick={() =>
                                listing.id && handleMarkAsSold(listing.id)
                              }
                              data-ocid="agent.secondary_button"
                            >
                              Mark as Sold
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>
                  <TabsContent value="sold" className="mt-4 space-y-3">
                    {soldListings.length === 0 ? (
                      <p
                        className="text-center text-muted-foreground py-8"
                        data-ocid="agent.empty_state"
                      >
                        No sold plots yet.
                      </p>
                    ) : (
                      soldListings.map((listing, i) => (
                        <div
                          key={listing.id}
                          className="border border-border rounded-lg p-3"
                          data-ocid={`agent.item.${i + 1}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-sm text-foreground">
                                {listing.ownerName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {listing.location ||
                                  listing.plotAddress ||
                                  "Location not set"}
                              </p>
                            </div>
                            <span className="text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-0.5">
                              Sold
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-1 text-xs h-7 px-2"
                            onClick={() => {
                              setSelectedPlot(listing);
                              setSalesListOpen(false);
                              setPlotDetailOpen(true);
                            }}
                            data-ocid="agent.secondary_button"
                          >
                            View Plot Details
                          </Button>
                        </div>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>

            {/* Agent and Owner Plot Sales - map view */}
            <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
              <DialogTrigger asChild>
                <Card
                  data-ocid="agent.card"
                  className="cursor-pointer hover:shadow-md transition-shadow"
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Agent &amp; Owner Plot Sales
                    </CardTitle>
                    <MapIcon className="w-5 h-5 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="font-serif font-bold text-4xl text-foreground">
                      {soldListings.length}
                    </div>
                    <p className="text-muted-foreground text-xs mt-1">
                      Plots sold \u2014 view all on map
                    </p>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent
                className="max-w-4xl w-full"
                data-ocid="agent.dialog"
              >
                <DialogHeader>
                  <DialogTitle className="font-serif text-xl flex items-center gap-2">
                    <MapIcon className="w-5 h-5 text-primary" />
                    Agent &amp; Owner Plot Sales Map
                  </DialogTitle>
                </DialogHeader>
                <div className="mt-2">
                  <div className="flex items-center gap-3 mb-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {forSaleListings.length} plots listed for sale
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Showing all plot locations on map
                      </p>
                    </div>
                  </div>
                  <div
                    className="rounded-xl overflow-hidden border border-border"
                    style={{ height: "420px" }}
                  >
                    <iframe
                      title="Agent & Owner Plot Sales Map"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      src="https://www.openstreetmap.org/export/embed.html?bbox=68.0,8.0,97.5,37.0&layer=mapnik"
                    />
                  </div>
                  {forSaleListings.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold text-foreground">
                        Listed Plots:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {forSaleListings.map((listing, idx) => (
                          <div
                            key={listing.id}
                            className="flex items-start gap-2 text-xs bg-muted/50 rounded-lg px-3 py-2"
                          >
                            <MapPin className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-foreground">
                                {listing.ownerName}
                              </p>
                              <p className="text-muted-foreground">
                                {listing.location ||
                                  listing.plotAddress ||
                                  "Location not set"}
                              </p>
                              <span className="inline-block text-xs bg-green-100 text-green-700 rounded px-1 mt-0.5">
                                {listing.addedBy} #{idx + 1}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {forSaleListings.length === 0 && (
                    <p
                      className="text-center text-muted-foreground text-sm mt-3"
                      data-ocid="agent.empty_state"
                    >
                      No plots listed yet. List a plot to see it on the map.
                    </p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Nearby Leads */}
          <div className="mb-10">
            <Collapsible
              open={nearbyLeadsOpen}
              onOpenChange={setNearbyLeadsOpen}
            >
              <Card data-ocid="agent.card" className="border-primary/20">
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="w-full"
                    data-ocid="agent.panel"
                  >
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <CardTitle className="font-serif text-lg text-foreground">
                            Nearby Leads
                          </CardTitle>
                          <p className="text-muted-foreground text-xs">
                            {
                              listings.filter(
                                (l) =>
                                  l.status === "for-sale" &&
                                  l.verified === true,
                              ).length
                            }{" "}
                            approved plots for sale
                          </p>
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-muted-foreground transition-transform ${nearbyLeadsOpen ? "rotate-180" : ""}`}
                      />
                    </CardHeader>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-5">
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={leadsCity}
                        onChange={(e) => setLeadsCity(e.target.value)}
                        placeholder="Filter by City / Area"
                        className="w-full pl-9 border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        data-ocid="agent.search_input"
                      />
                    </div>
                    {(() => {
                      const ownerLeads = listings.filter(
                        (l) => l.status === "for-sale" && l.verified === true,
                      );
                      const filteredLeads = ownerLeads.filter((lead) => {
                        if (!leadsCity.trim()) return true;
                        const city = leadsCity.toLowerCase();
                        return (
                          lead.ownerCity?.toLowerCase().includes(city) ||
                          lead.plotAddress?.toLowerCase().includes(city)
                        );
                      });
                      if (filteredLeads.length === 0) {
                        return (
                          <p
                            className="text-center text-muted-foreground py-8"
                            data-ocid="agent.empty_state"
                          >
                            No owner leads found
                            {leadsCity ? ` for ${leadsCity}` : ""}.
                          </p>
                        );
                      }
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filteredLeads.map((lead, i) => (
                            <div
                              key={lead.id}
                              className="border border-border rounded-xl p-4 bg-card shadow-sm"
                              data-ocid={`agent.item.${i + 1}`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <p className="font-medium text-foreground text-sm truncate">
                                  {lead.plotAddress || "Address not specified"}
                                </p>
                                <Badge
                                  variant={
                                    lead.status === "for-sale"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className={
                                    lead.status === "for-sale"
                                      ? "bg-green-100 text-green-800 border-green-200 shrink-0"
                                      : "bg-yellow-100 text-yellow-800 border-yellow-200 shrink-0"
                                  }
                                >
                                  {lead.status === "for-sale"
                                    ? "For Sale"
                                    : "Pending"}
                                </Badge>
                              </div>
                              {lead.ownerCity && (
                                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {lead.ownerCity}
                                </p>
                              )}
                              <div className="flex gap-4 text-xs text-muted-foreground mb-3">
                                {lead.plotSize && (
                                  <span>{lead.plotSize} sq.yd</span>
                                )}
                                {lead.price && <span>\u20b9{lead.price}</span>}
                              </div>
                              <Button
                                size="sm"
                                className="w-full"
                                onClick={() => {
                                  setSelectedLead(lead);
                                  setLeadDetailOpen(true);
                                }}
                                data-ocid="agent.secondary_button"
                              >
                                View Details
                              </Button>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>

          {/* Lead Detail Dialog */}
          <Dialog open={leadDetailOpen} onOpenChange={setLeadDetailOpen}>
            <DialogContent className="max-w-lg" data-ocid="agent.dialog">
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">
                  Owner Plot Details
                </DialogTitle>
                <DialogDescription>
                  Owner contact information for direct networking
                </DialogDescription>
              </DialogHeader>
              {selectedLead && (
                <div className="space-y-5 mt-2">
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
                      Owner Contact Details
                    </p>
                    <p className="font-serif font-bold text-2xl text-foreground mb-2">
                      {selectedLead.ownerName}
                    </p>
                    {selectedLead.ownerMobile && (
                      <a
                        href={`tel:${selectedLead.ownerMobile}`}
                        className="flex items-center gap-2 text-primary font-medium hover:underline"
                        data-ocid="agent.link"
                      >
                        <Phone className="w-4 h-4" />
                        {selectedLead.ownerMobile}
                        <span className="text-xs bg-primary/10 px-2 py-0.5 rounded-full">
                          Call
                        </span>
                      </a>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    {selectedLead.plotAddress && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Plot Address
                          </p>
                          <p className="text-foreground">
                            {selectedLead.plotAddress}
                          </p>
                        </div>
                      </div>
                    )}
                    {selectedLead.ownerCity && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            City / Area
                          </p>
                          <p className="text-foreground">
                            {selectedLead.ownerCity}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-4">
                      {selectedLead.plotSize && (
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Plot Size
                          </p>
                          <p className="text-foreground font-medium">
                            {selectedLead.plotSize} sq.yd
                          </p>
                        </div>
                      )}
                      {selectedLead.price && (
                        <div>
                          <p className="text-xs text-muted-foreground">Price</p>
                          <p className="text-foreground font-medium">
                            \u20b9{selectedLead.price}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          selectedLead.status === "for-sale"
                            ? "default"
                            : "secondary"
                        }
                        className={
                          selectedLead.status === "for-sale"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-yellow-100 text-yellow-800 border-yellow-200"
                        }
                      >
                        {selectedLead.status === "for-sale"
                          ? "For Sale"
                          : "Pending"}
                      </Badge>
                      {selectedLead.verified && (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                          \u2713 Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground border-t border-border pt-3">
                    This plot is visible to verified agents for quick
                    networking.
                  </p>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={plotDetailOpen} onOpenChange={setPlotDetailOpen}>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">
                  Plot Details
                </DialogTitle>
              </DialogHeader>
              {selectedPlot && (
                <div className="space-y-4 mt-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {selectedPlot.ownerName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedPlot.location ||
                        selectedPlot.plotAddress ||
                        "No address"}
                    </p>
                    {selectedPlot.plotPhasing && (
                      <p className="text-xs text-muted-foreground">
                        {selectedPlot.plotPhasing}
                      </p>
                    )}
                    {selectedPlot.price && (
                      <p className="text-sm font-semibold text-primary">
                        \u20b9{selectedPlot.price}
                      </p>
                    )}
                    {selectedPlot.plotSize && (
                      <p className="text-xs text-muted-foreground">
                        {selectedPlot.plotSize} sq.yd
                      </p>
                    )}
                  </div>
                  {selectedPlot.photoUrls &&
                  selectedPlot.photoUrls.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {selectedPlot.photoUrls.map((url, i) => (
                        <img
                          key={url}
                          src={url}
                          alt={`Plot view ${i + 1}`}
                          className="w-full rounded-lg object-cover aspect-video"
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No photos available.
                    </p>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Sales Performance Card with tab toggle */}
          <Card data-ocid="agent.card">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <CardTitle className="font-serif text-xl text-foreground">
                    Sales Performance
                  </CardTitle>
                  <p className="text-muted-foreground text-sm mt-0.5">
                    Plots sold vs uploaded over time
                  </p>
                </div>
                {/* Tab toggle pills */}
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setGraphTab("sold")}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      graphTab === "sold"
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                    }`}
                    data-ocid="agent.tab"
                  >
                    Plots Sold
                  </button>
                  <button
                    type="button"
                    onClick={() => setGraphTab("map")}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                      graphTab === "map"
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                    }`}
                    data-ocid="agent.tab"
                  >
                    <MapIcon className="w-3 h-3" />
                    Plot Locations
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {graphTab === "sold" ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={dynamicChartData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="sold"
                      name="Plots Sold"
                      stroke="#16a34a"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#16a34a" }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="uploaded"
                      name="Uploaded for Sales"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#2563eb" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div
                  style={{ height: "300px" }}
                  className="flex flex-col gap-3"
                >
                  {/* Info bar */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 rounded-lg border border-primary/10 shrink-0">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm font-semibold text-foreground">
                      {listings.filter((l) => l.lat && l.lng).length} plots with
                      GPS coordinates
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      \u2014 recently updated locations
                    </span>
                  </div>
                  {/* Leaflet Map with pins */}
                  <div
                    className="flex-1 rounded-xl overflow-hidden border border-border"
                    ref={plotMapRef}
                    style={{ minHeight: "200px" }}
                  />
                  {listings.filter((l) => l.lat && l.lng).length === 0 && (
                    <p
                      className="text-center text-muted-foreground text-xs"
                      data-ocid="agent.empty_state"
                    >
                      No plots with GPS coordinates yet. Pin a location when
                      uploading a plot.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </main>
  );
}
