import List "mo:core/List";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Map "mo:core/Map";
import Float "mo:core/Float";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Order "mo:core/Order";
import Bool "mo:core/Bool";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Initialize the user system state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  module PropertyListing {
    public func compare(l1 : PropertyListing, l2 : PropertyListing) : Order.Order {
      Nat.compare(l1.propertyId, l2.propertyId);
    };

    public func compareByPrice(l1 : PropertyListing, l2 : PropertyListing) : Order.Order {
      Nat.compare(l1.price, l2.price);
    };

    public func compareByAcreage(l1 : PropertyListing, l2 : PropertyListing) : Order.Order {
      Float.compare(l1.acreage, l2.acreage);
    };
  };

  type PropertyListing = {
    propertyId : Nat;
    title : Text;
    state : Text;
    county : Text;
    zip : Text;
    landType : {
      #agricultural;
      #residential;
      #commercial;
      #recreational;
      #timber;
    };
    price : Nat;
    acreage : Float;
    description : Text;
    imageUrl : Text;
    status : {
      #available;
      #sold;
    };
    isFeatured : Bool;
    created : Time.Time;
  };

  type BrokerProfile = {
    name : Text;
    title : Text;
    bio : Text;
    photoUrl : Text;
    phone : Text;
    email : Text;
  };

  type ContactInquiry = {
    name : Text;
    email : Text;
    phone : Text;
    message : Text;
    propertyId : ?Nat;
    timestamp : Time.Time;
  };

  public type UserProfile = {
    name : Text;
  };

  var nextPropertyId = 1;

  let propertyListings = Map.empty<Nat, PropertyListing>();
  let brokerProfiles = Map.empty<Nat, BrokerProfile>();
  let contactInquiries = Map.empty<Nat, ContactInquiry>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getListing(id : Nat) : async PropertyListing {
    switch (propertyListings.get(id)) {
      case (null) { Runtime.trap("Listing not found") };
      case (?listing) { listing };
    };
  };

  public query ({ caller }) func getFeaturedListings() : async [PropertyListing] {
    let featuredListings = List.empty<PropertyListing>();
    for (listing in propertyListings.values()) {
      if (listing.isFeatured) {
        featuredListings.add(listing);
      };
    };
    featuredListings.toArray();
  };

  public shared ({ caller }) func addListing(listing : PropertyListing) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add listings");
    };

    let newListing : PropertyListing = {
      listing with
      propertyId = nextPropertyId;
      created = Time.now();
    };

    propertyListings.add(nextPropertyId, newListing);
    nextPropertyId += 1;
    newListing.propertyId;
  };

  public shared ({ caller }) func updateListingStatus(id : Nat, status : { #available; #sold }) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update listing status");
    };

    switch (propertyListings.get(id)) {
      case (null) { Runtime.trap("Listing not found") };
      case (?listing) {
        let updatedListing : PropertyListing = {
          listing with status
        };
        propertyListings.add(id, updatedListing);
      };
    };
  };

  public shared ({ caller }) func addBrokerProfile(profile : BrokerProfile) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add broker profiles");
    };

    let id = brokerProfiles.size();
    brokerProfiles.add(id, profile);
    id;
  };

  public shared ({ caller }) func submitContactInquiry(inquiry : ContactInquiry) : async () {
    let id = contactInquiries.size();
    let newInquiry : ContactInquiry = {
      inquiry with timestamp = Time.now();
    };
    contactInquiries.add(id, newInquiry);
  };

  public query ({ caller }) func getAllBrokerProfiles() : async [BrokerProfile] {
    brokerProfiles.values().toArray();
  };

  public query ({ caller }) func searchListings(landType : ?{ #agricultural; #residential; #commercial; #recreational; #timber }, minPrice : ?Nat, maxPrice : ?Nat, minAcreage : ?Float) : async [PropertyListing] {
    let results = List.empty<PropertyListing>();
    for (listing in propertyListings.values()) {
      let matchesLandType = switch (landType) {
        case (null) { true };
        case (?typ) { listing.landType == typ };
      };

      let matchesMinPrice = switch (minPrice) {
        case (null) { true };
        case (?min) { listing.price >= min };
      };

      let matchesMaxPrice = switch (maxPrice) {
        case (null) { true };
        case (?max) { listing.price <= max };
      };

      let matchesMinAcreage = switch (minAcreage) {
        case (null) { true };
        case (?min) { listing.acreage >= min };
      };

      if (
        matchesLandType and matchesMinPrice and matchesMaxPrice and matchesMinAcreage
      ) {
        results.add(listing);
      };
    };
    results.toArray();
  };
};
