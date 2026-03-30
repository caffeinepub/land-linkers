import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface PropertyListing {
    zip: string;
    status: Variant_sold_available;
    title: string;
    created: Time;
    acreage: number;
    description: string;
    propertyId: bigint;
    state: string;
    imageUrl: string;
    isFeatured: boolean;
    landType: Variant_timber_commercial_agricultural_residential_recreational;
    price: bigint;
    county: string;
}
export interface ContactInquiry {
    name: string;
    propertyId?: bigint;
    email: string;
    message: string;
    timestamp: Time;
    phone: string;
}
export interface UserProfile {
    name: string;
}
export interface BrokerProfile {
    bio: string;
    title: string;
    name: string;
    photoUrl: string;
    email: string;
    phone: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_sold_available {
    sold = "sold",
    available = "available"
}
export enum Variant_timber_commercial_agricultural_residential_recreational {
    timber = "timber",
    commercial = "commercial",
    agricultural = "agricultural",
    residential = "residential",
    recreational = "recreational"
}
export interface backendInterface {
    addBrokerProfile(profile: BrokerProfile): Promise<bigint>;
    addListing(listing: PropertyListing): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAllBrokerProfiles(): Promise<Array<BrokerProfile>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getFeaturedListings(): Promise<Array<PropertyListing>>;
    getListing(id: bigint): Promise<PropertyListing>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchListings(landType: Variant_timber_commercial_agricultural_residential_recreational | null, minPrice: bigint | null, maxPrice: bigint | null, minAcreage: number | null): Promise<Array<PropertyListing>>;
    submitContactInquiry(inquiry: ContactInquiry): Promise<void>;
    updateListingStatus(id: bigint, status: Variant_sold_available): Promise<void>;
}
