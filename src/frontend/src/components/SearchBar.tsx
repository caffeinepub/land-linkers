import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { useState } from "react";

interface SearchBarProps {
  onSearch: (params: {
    query: string;
    landType: string | null;
    priceRange: string | null;
    acreage: string | null;
  }) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [landType, setLandType] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<string | null>(null);
  const [acreage, setAcreage] = useState<string | null>(null);

  const handleSearch = () => {
    onSearch({ query, landType, priceRange, acreage });
  };

  return (
    <div className="bg-card rounded-xl shadow-lg border border-border p-6">
      <h2 className="font-serif font-bold text-foreground text-xl mb-5">
        Search Land Listings
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <div className="lg:col-span-2">
          <Label
            htmlFor="search-location"
            className="text-sm font-medium text-foreground mb-1.5 block"
          >
            Location
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="search-location"
              placeholder="State, County or Zip Code"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              data-ocid="search.input"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
        </div>

        <div>
          <Label
            htmlFor="search-landtype"
            className="text-sm font-medium text-foreground mb-1.5 block"
          >
            Land Type
          </Label>
          <Select onValueChange={(v) => setLandType(v === "all" ? null : v)}>
            <SelectTrigger
              id="search-landtype"
              data-ocid="search.landtype.select"
            >
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="agricultural">Agricultural</SelectItem>
              <SelectItem value="recreational">Recreational</SelectItem>
              <SelectItem value="timber">Timber</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="residential">Residential</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label
            htmlFor="search-price"
            className="text-sm font-medium text-foreground mb-1.5 block"
          >
            Price Range
          </Label>
          <Select onValueChange={(v) => setPriceRange(v === "all" ? null : v)}>
            <SelectTrigger id="search-price" data-ocid="search.price.select">
              <SelectValue placeholder="Any Price" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Price</SelectItem>
              <SelectItem value="0-250000">Under $250K</SelectItem>
              <SelectItem value="250000-500000">$250K – $500K</SelectItem>
              <SelectItem value="500000-1000000">$500K – $1M</SelectItem>
              <SelectItem value="1000000+">Over $1M</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label
            htmlFor="search-acreage"
            className="text-sm font-medium text-foreground mb-1.5 block"
          >
            Acreage
          </Label>
          <Select onValueChange={(v) => setAcreage(v === "all" ? null : v)}>
            <SelectTrigger
              id="search-acreage"
              data-ocid="search.acreage.select"
            >
              <SelectValue placeholder="Any Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Size</SelectItem>
              <SelectItem value="0-50">Under 50 acres</SelectItem>
              <SelectItem value="50-100">50–100 acres</SelectItem>
              <SelectItem value="100-250">100–250 acres</SelectItem>
              <SelectItem value="250+">Over 250 acres</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="lg:col-span-5">
          <Button
            onClick={handleSearch}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 text-base"
            data-ocid="search.submit_button"
          >
            <Search className="w-4 h-4 mr-2" />
            Search Land
          </Button>
        </div>
      </div>
    </div>
  );
}
