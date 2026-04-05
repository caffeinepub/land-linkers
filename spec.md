# Land Linkers

## Current State

- PlotMapPicker component (`src/frontend/src/components/PlotMapPicker.tsx`) uses Leaflet (OpenStreetMap tiles) with click and touch long-press to pin a location. It accepts `center`, `pinnedCoords`, and `onPin` props.
- AgentPage uses PlotMapPicker in the "List a New Plot" form for coordinate capture (lat/lng saved to Firestore). The map tab in the stats section uses a raw Leaflet map with pins for all plots that have GPS coords.
- The map dialog for "Agent & Owner Plot Sales" embeds a static OpenStreetMap iframe — not interactive, does not show actual saved pins.
- No "Share Location" button exists on agent plot cards.
- OwnerPage also uses PlotMapPicker inline in the plot upload form.
- AdminPage has "Add New Plot" and "Home" buttons; User Management fetches users but may have real-time sync issues; delete functionality exists but may only remove from Firestore, not Firebase Auth.

## Requested Changes (Diff)

### Add
- **PlotMapPicker enhancements**: "My Location" button to center the map on the user's GPS position; "Confirm Location" button shown after a pin is dropped, displaying the captured lat/lng; full mobile-friendly touch UX.
- **"Share Location" button** on each plot card in the Agent's "My Uploaded Plots" list (both for-sale and sold tabs). Uses `navigator.share` if available (mobile Web Share API), falls back to `navigator.clipboard.writeText` with a Google Maps link (`https://maps.google.com/?q=lat,lng`).
- **Interactive Leaflet map** replacing the static iframe in the Agent's map dialog — uses `react-leaflet` (MapContainer, TileLayer, Marker with popups), shows all plots with GPS coords as draggable/clickable pins, fits bounds to all pins, "My Location" button to center on user GPS.

### Modify
- **AdminPage**: Remove "Add New Plot" button and "Home" button entirely.
- **AdminPage User Management**: Fix real-time Firestore listener to fetch ALL users (agents + owners + any other role) in a single unified list, showing Name, Email/Phone, and Role. Fix the delete function to call Firebase Auth Admin-style delete OR use Firebase Auth `deleteUser` via client SDK (noting client SDK can only delete the currently signed-in user; implement a Cloud Function call or mark user as deleted in Firestore and show instructions). Practically: delete the Firestore user doc and show a note that Firebase Auth record removal requires the Admin SDK or manual deletion via Firebase Console. Also add `onSnapshot` real-time listener for the users collection.
- **PlotMapPicker**: Upgrade to show "Confirm Location" overlay after pin is dropped, display coordinates, add "My Location" GPS button, ensure draggable marker.

### Remove
- "Add New Plot" button from AdminPage.
- "Home" navigation button from AdminPage.

## Implementation Plan

1. **PlotMapPicker.tsx** — Add: (a) "My Location" button that calls `navigator.geolocation.getCurrentPosition` and pans the map; (b) after a pin is placed, show a confirmation bar at the bottom with the lat/lng and a "Confirm Location" button that calls a new `onConfirm` callback; (c) ensure the component is exported with the updated interface.
2. **AgentPage.tsx** — (a) Add "Share Location" button to each listing card in "My Uploaded Plots" (for-sale and sold tabs) — only shown if the listing has `lat` and `lng`; uses `navigator.share` with a Google Maps URL, falls back to clipboard copy; (b) Replace the static iframe in the map dialog with a proper `react-leaflet` MapContainer showing all plots with GPS coords as Markers with popups; add "My Location" button to the map dialog; (c) Update PlotMapPicker usage to pass new `onConfirm` prop.
3. **AdminPage.tsx** — (a) Remove "Add New Plot" button; (b) Remove "Home" button; (c) Fix user list: use `onSnapshot` on the `users` Firestore collection (no role filter) to show all registered users in a single unified list with Name, Email/Phone, Role columns; (d) "Delete Account" button: deletes from Firestore `users` collection and shows a toast noting that the Firebase Auth record must be manually removed from Firebase Console (client SDK cannot delete other users' Auth records).
4. Ensure logo and "Connecting Spaces" tagline remain visible on updated screens (they are in the existing header/splash — no change needed unless broken).
