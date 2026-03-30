import {
  Variant_sold_available,
  Variant_timber_commercial_agricultural_residential_recreational,
} from "../backend.d";

export const SAMPLE_LISTINGS = [
  {
    propertyId: BigInt(1),
    title: "Rolling Meadows Farm",
    state: "Texas",
    county: "Hill County",
    zip: "76645",
    acreage: 250,
    price: BigInt(875000),
    landType:
      Variant_timber_commercial_agricultural_residential_recreational.agricultural,
    isFeatured: true,
    status: Variant_sold_available.available,
    description:
      "A stunning 250-acre agricultural property featuring rich black soil, seasonal creek, and a classic farmhouse. Perfect for row crops, cattle grazing, or diversified farming operations. Fenced and cross-fenced with rural water and electricity.",
    imageUrl: "/assets/generated/listing-rolling-meadows.dim_600x400.jpg",
    created: BigInt(Date.now()),
  },
  {
    propertyId: BigInt(2),
    title: "Blue Ridge Timberland",
    state: "North Carolina",
    county: "Ashe County",
    zip: "28615",
    acreage: 180,
    price: BigInt(540000),
    landType:
      Variant_timber_commercial_agricultural_residential_recreational.timber,
    isFeatured: true,
    status: Variant_sold_available.available,
    description:
      "180 acres of prime timberland nestled in the Blue Ridge Mountains. Mix of hardwoods and softwoods with excellent timber value, multiple springs, and breathtaking mountain views. Ideal for investment or recreational ownership.",
    imageUrl: "/assets/generated/listing-blue-ridge.dim_600x400.jpg",
    created: BigInt(Date.now()),
  },
  {
    propertyId: BigInt(3),
    title: "Lakefront Recreational Land",
    state: "Minnesota",
    county: "Cass County",
    zip: "56401",
    acreage: 45,
    price: BigInt(220000),
    landType:
      Variant_timber_commercial_agricultural_residential_recreational.recreational,
    isFeatured: true,
    status: Variant_sold_available.available,
    description:
      "45 acres of pristine recreational land with direct access to a private lake. Wooded shoreline, cabin site cleared, wildlife abundant. Perfect for hunting, fishing, and outdoor recreation.",
    imageUrl: "/assets/generated/listing-lakefront.dim_600x400.jpg",
    created: BigInt(Date.now()),
  },
  {
    propertyId: BigInt(4),
    title: "Commercial Development Site",
    state: "Arizona",
    county: "Maricopa County",
    zip: "85001",
    acreage: 12,
    price: BigInt(1200000),
    landType:
      Variant_timber_commercial_agricultural_residential_recreational.commercial,
    isFeatured: false,
    status: Variant_sold_available.available,
    description:
      "12-acre commercial development opportunity located near major highway interchange. Excellent visibility, utilities at road, zoned for mixed commercial use. Growing area with strong retail and industrial demand.",
    imageUrl: "",
    created: BigInt(Date.now()),
  },
  {
    propertyId: BigInt(5),
    title: "Organic Farm Opportunity",
    state: "Oregon",
    county: "Willamette Valley",
    zip: "97401",
    acreage: 320,
    price: BigInt(960000),
    landType:
      Variant_timber_commercial_agricultural_residential_recreational.agricultural,
    isFeatured: false,
    status: Variant_sold_available.available,
    description:
      "320-acre certified organic farmland in the heart of Oregon's Willamette Valley. Excellent soil health, irrigation rights, and established infrastructure including barns, cold storage, and equipment sheds.",
    imageUrl: "",
    created: BigInt(Date.now()),
  },
  {
    propertyId: BigInt(6),
    title: "Mountain Retreat Parcel",
    state: "Colorado",
    county: "Summit County",
    zip: "80435",
    acreage: 80,
    price: BigInt(380000),
    landType:
      Variant_timber_commercial_agricultural_residential_recreational.residential,
    isFeatured: false,
    status: Variant_sold_available.available,
    description:
      "80 acres of spectacular mountain land with panoramic Rocky Mountain views. Multiple build sites, private road access, year-round creek, and abundant wildlife. Perfect for a private mountain retreat or luxury estate.",
    imageUrl: "",
    created: BigInt(Date.now()),
  },
];

export const SAMPLE_BROKERS = [
  {
    name: "Sarah Mitchell",
    title: "Senior Land Specialist",
    bio: "With 15 years of experience in land brokerage, Sarah specializes in agricultural and recreational properties across the Southwest. She has closed over $200M in land transactions and is a Accredited Land Consultant.",
    photoUrl: "/assets/generated/broker-sarah.dim_400x400.jpg",
    email: "sarah.mitchell@landbroker.pro",
    phone: "(512) 555-0182",
  },
  {
    name: "James Hargrove",
    title: "Agricultural Land Expert",
    bio: "James brings 20 years of expertise in agricultural land sales, helping farmers and investors find the right properties. He holds a B.S. in Agriculture and is a certified Farm Manager with deep knowledge of soil science.",
    photoUrl: "",
    email: "james.hargrove@landbroker.pro",
    phone: "(919) 555-0247",
  },
  {
    name: "Lisa Chen",
    title: "Commercial Land Advisor",
    bio: "Lisa is a 10-year veteran of commercial land transactions, focusing on development sites and investment properties. Her background in urban planning gives clients a unique edge in evaluating development potential.",
    photoUrl: "",
    email: "lisa.chen@landbroker.pro",
    phone: "(602) 555-0391",
  },
];

export const LAND_TYPE_LABELS: Record<string, string> = {
  agricultural: "Agricultural",
  timber: "Timber",
  recreational: "Recreational",
  commercial: "Commercial",
  residential: "Residential",
};

export const LAND_TYPE_COLORS: Record<string, string> = {
  agricultural: "bg-green-100 text-green-800",
  timber: "bg-amber-100 text-amber-800",
  recreational: "bg-blue-100 text-blue-800",
  commercial: "bg-purple-100 text-purple-800",
  residential: "bg-orange-100 text-orange-800",
};
