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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  Camera,
  Check,
  CheckCircle,
  ChevronDown,
  Copy,
  ImageIcon,
  Loader2,
  Mail,
  Map as MapIcon,
  MapPin,
  Phone,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
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
  updateUserLastLogin,
} from "../utils/firebaseStore";
import type { PlotListing } from "../utils/firebaseStore";

export function OwnerPage() {
  const { userName, userLoginId, userCreatedAt } = useAuth();
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [confirmedPhotoLink, setConfirmedPhotoLink] = useState<string | null>(
    null,
  );
  const [confirmedPhotoLinkId, setConfirmedPhotoLinkId] = useState<
    string | null
  >(null);
  const [confirmedPhotoUrls, setConfirmedPhotoUrls] = useState<string[]>([]);
  const [ownerName, setOwnerName] = useState("");
  const [ownerMobile, setOwnerMobile] = useState("");
  const [ownerCity, setOwnerCity] = useState("");
  const [plotAddress, setPlotAddress] = useState("");
  const [plotSize, setPlotSize] = useState("");
  const [price, setPrice] = useState("");
  const [layoutName, setLayoutName] = useState("");
  const [plotNumber, setPlotNumber] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedListings, setSubmittedListings] = useState<PlotListing[]>([]);
  const [userCity, setUserCity] = useState<string>("Locating...");
  const [profileOpen, setProfileOpen] = useState(false);

  // Map state
  const [savedCoords, setSavedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    20.5937, 78.9629,
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Track last login for inactivity logic
  useEffect(() => {
    updateUserLastLogin("owner_default", "owner");
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

  // Load owner's existing plots from Firestore on mount
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    getListings().then((allListings) => {
      const myPlots = allListings.filter(
        (p) => p.addedBy === "owner" && p.ownerId === uid,
      );
      if (myPlots.length > 0) {
        setSubmittedListings(myPlots);
      }
    });
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      // Compress images before upload
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

  const handleViewOnMap = async () => {
    if (!plotAddress.trim()) {
      toast.warning("Please enter an address first");
      return;
    }
    setIsGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(plotAddress)}&limit=1`,
        { headers: { "Accept-Language": "en" } },
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = Number.parseFloat(data[0].lat);
        const lng = Number.parseFloat(data[0].lon);
        setMapCenter([lat, lng]);
      } else {
        toast.error("Address not found. Try a more specific address.");
      }
    } catch {
      toast.error("Failed to search address. Check your connection.");
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newListing: Omit<PlotListing, "id"> = {
        ownerName,
        ownerMobile,
        ownerCity,
        plotAddress,
        plotSize,
        price,
        layoutName,
        plotNumber,
        photoLinkId: confirmedPhotoLinkId ?? undefined,
        photoLink: confirmedPhotoLink ?? undefined,
        photoUrls: confirmedPhotoUrls,
        status: "for-sale",
        addedBy: "owner",
        verified: false,
        createdAt: new Date().toISOString(),
        lastOwnerLogin: new Date().toISOString(),
        ownerId: auth.currentUser?.uid,
        ...(savedCoords ? { lat: savedCoords.lat, lng: savedCoords.lng } : {}),
      };
      const id = await saveListing(newListing);
      setSubmittedListings((prev) => [...prev, { ...newListing, id }]);
      toast.success("Plot details submitted successfully!");
      setOwnerName("");
      setOwnerMobile("");
      setOwnerCity("");
      setPlotAddress("");
      setPlotSize("");
      setPrice("");
      setLayoutName("");
      setPlotNumber("");
      setPendingImages([]);
      setConfirmedPhotoLink(null);
      setConfirmedPhotoLinkId(null);
      setConfirmedPhotoUrls([]);
      setSavedCoords(null);
    } catch {
      toast.error("Failed to submit plot. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsSold = async (listing: PlotListing) => {
    try {
      await updateListingStatus(listing.id, "sold");
      setSubmittedListings((prev) =>
        prev.map((l) => (l.id === listing.id ? { ...l, status: "sold" } : l)),
      );
      toast.success("Plot marked as sold!");
    } catch {
      toast.error("Failed to mark as sold.");
    }
  };

  return (
    <main className="bg-background min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Owner Profile Card */}
          <Collapsible
            open={profileOpen}
            onOpenChange={setProfileOpen}
            className="mb-8"
          >
            <Card data-ocid="owner.card" className="border-primary/20">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="w-full"
                  data-ocid="owner.panel"
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <CardTitle className="font-serif text-lg text-foreground">
                          {userName || "Owner"}
                        </CardTitle>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-muted-foreground transition-transform ${profileOpen ? "rotate-180" : ""}`}
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
                      <span>{userLoginId || "—"}</span>
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
                          : "—"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-serif font-bold text-3xl text-foreground">
              Owner Portal
            </h1>
            <p className="text-primary font-medium text-sm mt-0.5">
              Welcome, {userName || "Owner"}
            </p>
            <p className="text-muted-foreground mt-1">
              Upload images and fill in your plot details to list your property
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <Card data-ocid="owner.card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Uploaded for Sales
                </CardTitle>
                <Upload className="w-5 h-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="font-serif font-bold text-4xl text-foreground">
                  {submittedListings.filter((l) => l.status !== "sold").length}
                </div>
              </CardContent>
            </Card>
            <Card data-ocid="owner.card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Plots Sold
                </CardTitle>
                <CheckCircle className="w-5 h-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="font-serif font-bold text-4xl text-foreground">
                  {submittedListings.filter((l) => l.status === "sold").length}
                </div>
              </CardContent>
            </Card>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Upload Images */}
            <Card data-ocid="owner.card">
              <CardHeader>
                <CardTitle className="font-serif text-lg text-foreground">
                  Upload Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
                    data-ocid="owner.upload_button"
                  >
                    <ImageIcon className="w-9 h-9 text-muted-foreground" />
                    <div className="text-center">
                      <div className="font-medium text-foreground text-sm">
                        Upload Images
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Choose from gallery
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
                    data-ocid="owner.camera_button"
                  >
                    <Camera className="w-9 h-9 text-muted-foreground" />
                    <div className="text-center">
                      <div className="font-medium text-foreground text-sm">
                        Click Picture
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Use live camera
                      </div>
                    </div>
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageUpload}
                />

                {/* Pending preview grid */}
                {pendingImages.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-2 font-medium">
                      Review photos before confirming ({pendingImages.length}{" "}
                      selected):
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                      {pendingImages.map((file, i) => (
                        <div
                          key={`${file.name}-${i}`}
                          className="aspect-square rounded-lg overflow-hidden border border-border bg-muted relative group"
                          data-ocid={`owner.item.${i + 1}`}
                        >
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(i)}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors shadow-md"
                            title="Delete photo"
                            data-ocid="owner.delete_button"
                          >
                            <span className="text-xs font-bold leading-none">
                              ✕
                            </span>
                          </button>
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      onClick={handleConfirmPhotos}
                      disabled={isConfirming}
                      className="mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold gap-2"
                      data-ocid="owner.confirm_button"
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

                {/* Confirmed photo link */}
                {confirmedPhotoLink && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs font-medium text-green-800 mb-2">
                      ✓ {confirmedPhotoUrls.length} photo(s) confirmed
                    </p>
                    <div className="flex items-center gap-2">
                      <a
                        href={confirmedPhotoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-xs text-green-700 font-mono bg-green-100 rounded px-2 py-1 truncate hover:underline"
                        data-ocid="owner.link"
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
                        className="p-1.5 rounded hover:bg-green-200 text-green-700 transition-colors"
                        data-ocid="owner.secondary_button"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <a
                      href={confirmedPhotoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-600 hover:text-green-700 underline mt-1 inline-block"
                      data-ocid="owner.link"
                    >
                      View Slideshow →
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Plot + Extra Details */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card data-ocid="owner.card">
                <CardHeader>
                  <CardTitle className="font-serif text-lg text-foreground">
                    Plot Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label
                      htmlFor="owner-name"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Owner Name
                    </label>
                    <input
                      id="owner-name"
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="Enter owner name"
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      data-ocid="owner.input"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="owner-mobile"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Mobile Number
                    </label>
                    <input
                      id="owner-mobile"
                      type="tel"
                      value={ownerMobile}
                      onChange={(e) => setOwnerMobile(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      data-ocid="owner.input"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="owner-city"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      City / Area
                    </label>
                    <input
                      id="owner-city"
                      type="text"
                      value={ownerCity}
                      onChange={(e) => setOwnerCity(e.target.value)}
                      placeholder="e.g. Bangalore"
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      data-ocid="owner.input"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="plot-address"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Plot Location Address
                    </label>
                    <input
                      id="plot-address"
                      type="text"
                      value={plotAddress}
                      onChange={(e) => setPlotAddress(e.target.value)}
                      placeholder="Enter plot address"
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      data-ocid="owner.input"
                      required
                    />
                    <div className="mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleViewOnMap}
                        disabled={isGeocoding}
                        className="gap-1.5"
                        data-ocid="owner.secondary_button"
                      >
                        {isGeocoding ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <MapIcon className="w-3.5 h-3.5" />
                        )}
                        {isGeocoding ? "Searching..." : "Search on Map"}
                      </Button>
                    </div>
                    <div className="mt-3" style={{ height: "350px" }}>
                      <PlotMapPicker
                        center={mapCenter}
                        pinnedCoords={savedCoords}
                        onPin={setSavedCoords}
                      />
                    </div>
                    {savedCoords && (
                      <span className="inline-flex items-center gap-1.5 text-xs bg-green-100 text-green-700 border border-green-200 rounded-full px-3 py-1 font-medium mt-2">
                        <MapPin className="w-3 h-3" />📍 Pinned:{" "}
                        {savedCoords.lat.toFixed(5)},{" "}
                        {savedCoords.lng.toFixed(5)}
                      </span>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="plot-size"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Plot Size (sq. yards)
                    </label>
                    <input
                      id="plot-size"
                      type="number"
                      value={plotSize}
                      onChange={(e) => setPlotSize(e.target.value)}
                      placeholder="e.g. 200"
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      data-ocid="owner.input"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="plot-price"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Price
                    </label>
                    <div className="flex items-center border border-border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-ring">
                      <span className="px-3 text-sm text-muted-foreground bg-muted border-r border-border py-2">
                        ₹
                      </span>
                      <input
                        id="plot-price"
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="Enter price"
                        className="flex-1 px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none"
                        data-ocid="owner.input"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-ocid="owner.card">
                <CardHeader>
                  <CardTitle className="font-serif text-lg text-foreground">
                    Extra Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label
                      htmlFor="layout-name"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Layout Name
                    </label>
                    <input
                      id="layout-name"
                      type="text"
                      value={layoutName}
                      onChange={(e) => setLayoutName(e.target.value)}
                      placeholder="e.g. Green Valley Layout"
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      data-ocid="owner.input"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="plot-number"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Plot Number
                    </label>
                    <input
                      id="plot-number"
                      type="text"
                      value={plotNumber}
                      onChange={(e) => setPlotNumber(e.target.value)}
                      placeholder="e.g. A-42"
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      data-ocid="owner.input"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <Card data-ocid="owner.card">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-primary hover:bg-primary/90 text-white font-semibold gap-2 flex-1 sm:flex-none"
                    data-ocid="owner.submit_button"
                  >
                    {isSubmitting && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    {isSubmitting ? "Submitting..." : "Submit Plot Details"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>

          {/* Submitted Plots */}
          {submittedListings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10"
            >
              <h2 className="font-serif font-bold text-xl text-foreground mb-4">
                My Submitted Plots
              </h2>
              <div className="space-y-4">
                {submittedListings.map((listing, i) => (
                  <Card key={listing.id} data-ocid={`owner.item.${i + 1}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">
                              {listing.ownerName}
                            </h3>
                            {listing.verified && (
                              <Badge className="bg-green-100 text-green-700 border-green-200 text-xs gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Verified
                              </Badge>
                            )}
                            {listing.status === "sold" && (
                              <Badge className="bg-gray-100 text-gray-700 border-gray-200 text-xs">
                                Sold
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            {listing.plotAddress && (
                              <p className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 shrink-0" />
                                {listing.plotAddress}
                              </p>
                            )}
                            {listing.price && (
                              <p>
                                ₹{" "}
                                {Number(listing.price).toLocaleString("en-IN")}
                              </p>
                            )}
                            {listing.plotSize && (
                              <p>{listing.plotSize} sq. yd</p>
                            )}
                          </div>
                          {listing.photoLink && (
                            <a
                              href={listing.photoLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline mt-2 inline-block"
                              data-ocid="owner.link"
                            >
                              View Photos →
                            </a>
                          )}
                        </div>

                        {/* Mark as Sold */}
                        {listing.status !== "sold" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="shrink-0 gap-1.5"
                                data-ocid={`owner.delete_button.${i + 1}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Mark as Sold
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent data-ocid="owner.dialog">
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Mark plot as sold?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will mark the plot for{" "}
                                  <strong>{listing.ownerName}</strong> as sold
                                  and update the counter. The listing will
                                  remain visible with a Sold badge.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel data-ocid="owner.cancel_button">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleMarkAsSold(listing)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  data-ocid="owner.confirm_button"
                                >
                                  Yes, Mark as Sold
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
