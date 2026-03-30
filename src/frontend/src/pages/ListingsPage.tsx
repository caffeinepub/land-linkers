import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { PropertyListing } from "../backend.d";
import { ListingCard } from "../components/ListingCard";
import { ListingDetail } from "../components/ListingDetail";
import { LAND_TYPE_LABELS } from "../data/sampleData";
import { useAllListings } from "../hooks/useQueries";

const SKELETON_KEYS = ["sk1", "sk2", "sk3", "sk4", "sk5", "sk6"];

export function ListingsPage() {
  const { data: allListings = [], isLoading } = useAllListings();
  const [selectedListing, setSelectedListing] =
    useState<PropertyListing | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [landTypeFilter, setLandTypeFilter] = useState<string>("all");
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [acreageFilter, setAcreageFilter] = useState<string>("all");

  const filtered = allListings.filter((listing) => {
    const matchesQuery =
      !query ||
      listing.title.toLowerCase().includes(query.toLowerCase()) ||
      listing.state.toLowerCase().includes(query.toLowerCase()) ||
      listing.county.toLowerCase().includes(query.toLowerCase()) ||
      listing.zip.includes(query);

    const matchesType =
      landTypeFilter === "all" || listing.landType === landTypeFilter;

    const price = Number(listing.price);
    const matchesPrice =
      priceFilter === "all" ||
      (priceFilter === "0-250000" && price < 250000) ||
      (priceFilter === "250000-500000" && price >= 250000 && price < 500000) ||
      (priceFilter === "500000-1000000" &&
        price >= 500000 &&
        price < 1000000) ||
      (priceFilter === "1000000+" && price >= 1000000);

    const matchesAcreage =
      acreageFilter === "all" ||
      (acreageFilter === "0-50" && listing.acreage < 50) ||
      (acreageFilter === "50-100" &&
        listing.acreage >= 50 &&
        listing.acreage < 100) ||
      (acreageFilter === "100-250" &&
        listing.acreage >= 100 &&
        listing.acreage < 250) ||
      (acreageFilter === "250+" && listing.acreage >= 250);

    return matchesQuery && matchesType && matchesPrice && matchesAcreage;
  });

  const hasFilters =
    query ||
    landTypeFilter !== "all" ||
    priceFilter !== "all" ||
    acreageFilter !== "all";

  const clearFilters = () => {
    setQuery("");
    setLandTypeFilter("all");
    setPriceFilter("all");
    setAcreageFilter("all");
  };

  return (
    <main className="bg-background min-h-screen">
      {/* Page Header */}
      <div className="bg-navy py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p className="text-primary font-semibold text-sm tracking-widest uppercase mb-2">
              All Properties
            </p>
            <h1 className="font-serif font-bold text-white text-5xl mb-3">
              Land Listings
            </h1>
            <p className="text-white/60 text-lg">
              Browse our complete portfolio of premium land properties
            </p>
          </motion.div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border-b border-border sticky top-16 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, state, county or zip…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
                data-ocid="listings.search_input"
              />
            </div>

            <div className="flex gap-2 items-center flex-wrap">
              <Select value={landTypeFilter} onValueChange={setLandTypeFilter}>
                <SelectTrigger
                  className="w-36"
                  data-ocid="listings.type.select"
                >
                  <SelectValue placeholder="Land Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(LAND_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger
                  className="w-36"
                  data-ocid="listings.price.select"
                >
                  <SelectValue placeholder="Price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Price</SelectItem>
                  <SelectItem value="0-250000">Under $250K</SelectItem>
                  <SelectItem value="250000-500000">$250K – $500K</SelectItem>
                  <SelectItem value="500000-1000000">$500K – $1M</SelectItem>
                  <SelectItem value="1000000+">Over $1M</SelectItem>
                </SelectContent>
              </Select>

              <Select value={acreageFilter} onValueChange={setAcreageFilter}>
                <SelectTrigger
                  className="w-36"
                  data-ocid="listings.acreage.select"
                >
                  <SelectValue placeholder="Acreage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Size</SelectItem>
                  <SelectItem value="0-50">Under 50 ac</SelectItem>
                  <SelectItem value="50-100">50–100 ac</SelectItem>
                  <SelectItem value="100-250">100–250 ac</SelectItem>
                  <SelectItem value="250+">Over 250 ac</SelectItem>
                </SelectContent>
              </Select>

              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground"
                  data-ocid="listings.clear_filters.button"
                >
                  <X className="w-4 h-4 mr-1" /> Clear
                </Button>
              )}
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground text-sm">
              {filtered.length}{" "}
              {filtered.length === 1 ? "property" : "properties"} found
            </span>
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {isLoading ? (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            data-ocid="listings.loading_state"
          >
            {SKELETON_KEYS.map((k) => (
              <div
                key={k}
                className="bg-card rounded-lg h-72 animate-pulse border border-border"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20" data-ocid="listings.empty_state">
            <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-serif font-bold text-foreground text-2xl mb-2">
              No Properties Found
            </h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your search filters to see more results.
            </p>
            <Button
              onClick={clearFilters}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Clear All Filters
            </Button>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            data-ocid="listings.list"
          >
            {filtered.map((listing, i) => (
              <ListingCard
                key={listing.propertyId.toString()}
                listing={listing}
                index={i}
                onViewDetails={(l) => {
                  setSelectedListing(l);
                  setDetailOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </section>

      <ListingDetail
        listing={selectedListing}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </main>
  );
}
