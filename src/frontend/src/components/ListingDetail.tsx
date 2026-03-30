import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { DollarSign, MapPin, Maximize2, Tag, X } from "lucide-react";
import type { PropertyListing } from "../backend.d";
import { LAND_TYPE_COLORS, LAND_TYPE_LABELS } from "../data/sampleData";
import { ContactForm } from "./ContactForm";

interface ListingDetailProps {
  listing: PropertyListing | null;
  open: boolean;
  onClose: () => void;
}

export function ListingDetail({ listing, open, onClose }: ListingDetailProps) {
  if (!listing) return null;

  const price = Number(listing.price);
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);

  const landTypeLabel = LAND_TYPE_LABELS[listing.landType] ?? listing.landType;
  const landTypeBadgeClass =
    LAND_TYPE_COLORS[listing.landType] ?? "bg-gray-100 text-gray-800";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto p-0"
        data-ocid="listing.dialog"
      >
        {/* Image */}
        {listing.imageUrl ? (
          <div className="h-64 overflow-hidden">
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-48 bg-gradient-to-br from-green-800 to-green-600 flex items-center justify-center">
            <MapPin className="w-16 h-16 text-white/30" />
          </div>
        )}

        <div className="p-6">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="font-serif text-2xl font-bold text-foreground">
                  {listing.title}
                </DialogTitle>
                <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">
                    {listing.county ? `${listing.county}, ` : ""}
                    {listing.state} {listing.zip}
                  </span>
                </div>
              </div>
              <span
                className={`text-sm font-semibold px-3 py-1 rounded-full whitespace-nowrap ${landTypeBadgeClass}`}
              >
                {landTypeLabel}
              </span>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <DollarSign className="w-5 h-5 text-primary mx-auto mb-1" />
              <div className="font-bold text-foreground text-lg">
                {formattedPrice}
              </div>
              <div className="text-xs text-muted-foreground">Asking Price</div>
            </div>
            <div className="text-center">
              <Maximize2 className="w-5 h-5 text-primary mx-auto mb-1" />
              <div className="font-bold text-foreground text-lg">
                {listing.acreage} ac
              </div>
              <div className="text-xs text-muted-foreground">Total Acreage</div>
            </div>
            <div className="text-center col-span-2 sm:col-span-1">
              <Tag className="w-5 h-5 text-primary mx-auto mb-1" />
              <div className="font-bold text-foreground text-lg capitalize">
                {listing.status}
              </div>
              <div className="text-xs text-muted-foreground">Status</div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="font-semibold text-foreground mb-2">
              Property Description
            </h4>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {listing.description}
            </p>
          </div>

          <Separator className="my-6" />

          <div>
            <h4 className="font-serif font-bold text-foreground text-xl mb-4">
              Inquire About This Property
            </h4>
            <ContactForm
              prefillMessage={`I'm interested in "${listing.title}" listed at ${formattedPrice}. Please provide more information.`}
              prefillPropertyId={listing.propertyId}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
