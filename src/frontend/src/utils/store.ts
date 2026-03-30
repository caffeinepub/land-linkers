export interface PlotListing {
  id: string;
  ownerName: string;
  plotAddress?: string;
  plotSize?: string;
  price?: string;
  layoutName?: string;
  plotNumber?: string;
  plotPhasing?: string;
  location?: string;
  photoLinkId?: string;
  photoLink?: string;
  status: "for-sale" | "sold";
  addedBy: "owner" | "agent";
  createdAt: string;
}

export function getListings(): PlotListing[] {
  try {
    return JSON.parse(localStorage.getItem("ll_listings") || "[]");
  } catch {
    return [];
  }
}

export function saveListing(listing: PlotListing) {
  const all = getListings();
  all.push(listing);
  localStorage.setItem("ll_listings", JSON.stringify(all));
}

export function savePhotos(id: string, base64Images: string[]) {
  localStorage.setItem(`ll_photos_${id}`, JSON.stringify(base64Images));
}

export function getPhotos(id: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(`ll_photos_${id}`) || "[]");
  } catch {
    return [];
  }
}
