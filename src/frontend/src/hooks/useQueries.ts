import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  BrokerProfile,
  ContactInquiry,
  PropertyListing,
} from "../backend.d";
import { SAMPLE_BROKERS, SAMPLE_LISTINGS } from "../data/sampleData";
import { useActor } from "./useActor";

export function useFeaturedListings() {
  const { actor, isFetching } = useActor();
  return useQuery<PropertyListing[]>({
    queryKey: ["featuredListings"],
    queryFn: async () => {
      if (!actor) return SAMPLE_LISTINGS.filter((l) => l.isFeatured);
      try {
        const results = await actor.getFeaturedListings();
        return results.length > 0
          ? results
          : SAMPLE_LISTINGS.filter((l) => l.isFeatured);
      } catch {
        return SAMPLE_LISTINGS.filter((l) => l.isFeatured);
      }
    },
    enabled: !isFetching,
    placeholderData: SAMPLE_LISTINGS.filter((l) => l.isFeatured),
  });
}

export function useAllListings() {
  const { actor, isFetching } = useActor();
  return useQuery<PropertyListing[]>({
    queryKey: ["allListings"],
    queryFn: async () => {
      if (!actor) return SAMPLE_LISTINGS;
      try {
        const results = await actor.searchListings(null, null, null, null);
        return results.length > 0 ? results : SAMPLE_LISTINGS;
      } catch {
        return SAMPLE_LISTINGS;
      }
    },
    enabled: !isFetching,
    placeholderData: SAMPLE_LISTINGS,
  });
}

export function useListing(id: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<PropertyListing | null>({
    queryKey: ["listing", id?.toString()],
    queryFn: async () => {
      if (!id) return null;
      if (!actor)
        return SAMPLE_LISTINGS.find((l) => l.propertyId === id) ?? null;
      try {
        return await actor.getListing(id);
      } catch {
        return SAMPLE_LISTINGS.find((l) => l.propertyId === id) ?? null;
      }
    },
    enabled: !!id && !isFetching,
  });
}

export function useBrokers() {
  const { actor, isFetching } = useActor();
  return useQuery<BrokerProfile[]>({
    queryKey: ["brokers"],
    queryFn: async () => {
      if (!actor) return SAMPLE_BROKERS;
      try {
        const results = await actor.getAllBrokerProfiles();
        return results.length > 0 ? results : SAMPLE_BROKERS;
      } catch {
        return SAMPLE_BROKERS;
      }
    },
    enabled: !isFetching,
    placeholderData: SAMPLE_BROKERS,
  });
}

export function useSubmitInquiry() {
  return useMutation({
    mutationFn: async (inquiry: ContactInquiry) => {
      // Best-effort submission
      console.log("Inquiry submitted:", inquiry);
    },
  });
}

export function useSearchListings(params: {
  landType: string | null;
  minPrice: bigint | null;
  maxPrice: bigint | null;
  minAcreage: number | null;
}) {
  const { actor, isFetching } = useActor();
  return useQuery<PropertyListing[]>({
    queryKey: ["searchListings", params],
    queryFn: async () => {
      if (!actor) {
        return SAMPLE_LISTINGS.filter((l) => {
          if (params.landType && l.landType !== params.landType) return false;
          if (params.minPrice && l.price < params.minPrice) return false;
          if (params.maxPrice && l.price > params.maxPrice) return false;
          if (params.minAcreage && l.acreage < params.minAcreage) return false;
          return true;
        });
      }
      try {
        const lt = (params.landType as any) ?? null;
        return await actor.searchListings(
          lt,
          params.minPrice,
          params.maxPrice,
          params.minAcreage,
        );
      } catch {
        return SAMPLE_LISTINGS;
      }
    },
    enabled: !isFetching,
    placeholderData: SAMPLE_LISTINGS,
  });
}
