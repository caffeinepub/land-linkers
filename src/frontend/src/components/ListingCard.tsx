import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, MapPin, Maximize2, Star } from "lucide-react";
import { motion } from "motion/react";
import type { PropertyListing } from "../backend.d";
import { LAND_TYPE_COLORS, LAND_TYPE_LABELS } from "../data/sampleData";

interface ListingCardProps {
  listing: PropertyListing;
  index: number;
  onViewDetails: (listing: PropertyListing) => void;
}

export function ListingCard({
  listing,
  index,
  onViewDetails,
}: ListingCardProps) {
  const price = Number(listing.price);
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);

  const landTypeLabel = LAND_TYPE_LABELS[listing.landType] ?? listing.landType;
  const landTypeBadgeClass =
    LAND_TYPE_COLORS[listing.landType] ?? "bg-gray-100 text-gray-800";

  const placeholderGradients = [
    "from-green-800 to-green-600",
    "from-amber-800 to-amber-600",
    "from-blue-800 to-blue-600",
    "from-purple-800 to-purple-600",
  ];
  const gradient = placeholderGradients[index % placeholderGradients.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="bg-card rounded-lg overflow-hidden shadow-sm border border-border hover:shadow-lg transition-shadow group"
      data-ocid={`listing.item.${index + 1}`}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        {listing.imageUrl ? (
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
          >
            <MapPin className="w-12 h-12 text-white/40" />
          </div>
        )}
        {listing.isFeatured && (
          <div className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <Star className="w-3 h-3" />
            Featured
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${landTypeBadgeClass}`}
          >
            {landTypeLabel}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-serif font-bold text-foreground text-lg mb-1 leading-snug">
          {listing.title}
        </h3>
        <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
          <MapPin className="w-3.5 h-3.5" />
          <span>
            {listing.county ? `${listing.county}, ` : ""}
            {listing.state}
          </span>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 text-primary font-bold text-xl">
            <DollarSign className="w-4 h-4" />
            <span>{formattedPrice}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <Maximize2 className="w-3.5 h-3.5" />
            <span>{listing.acreage} acres</span>
          </div>
        </div>

        <Button
          onClick={() => onViewDetails(listing)}
          className="w-full bg-navy hover:bg-navy/90 text-white font-semibold"
          size="sm"
          data-ocid={`listing.view_details.button.${index + 1}`}
        >
          View Details
        </Button>
      </div>
    </motion.div>
  );
}
