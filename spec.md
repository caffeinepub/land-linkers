# Land Linkers – Admin Dashboard: Total Users Enhancement

## Current State

The Admin Dashboard (`AdminPage.tsx`) has a "Manage Users" tab with an inner Tabs component splitting users into "Agents" and "Owners". The current user card shows:
- Name
- Email/Phone (loginId / email / mobile)
- Role + Last Login date
- A "Delete" button that only removes from Firestore `users` collection (NOT from Firebase Auth)

Users are fetched via a real-time `onSnapshot` on the `users` collection. Plots are fetched separately via a polling `getListings()` call every 30 seconds.

The "Total Users" stat card in the header shows the total count but is not clickable.

FirebaseStore's `deleteUser()` only deletes from Firestore; Firebase Auth deletion is not currently implemented client-side.

## Requested Changes (Diff)

### Add
- Real-time plot count per user: for each user, count how many plots they have in the `plots` collection (matched by `ownerId` or `addedBy` with user's email/loginId).
- Sort both Agent and Owner lists by plot count descending (most plots first).
- Expanded user card data: show Name, Email/Phone, Role badge, Plots count (e.g. "Plots: 25"), and Joined Date (from `createdAt` field, formatted as month/year).
- Also add an `onSnapshot` listener on `plots` collection so plot counts update in real time when plots are added/removed.
- Delete User now calls a Firebase callable function OR uses the Admin SDK via a backend HTTP outcall — but since we have no backend access to Firebase Admin SDK, implement it as: delete from Firestore `users` collection AND show an informational toast. NOTE: Firebase Auth user deletion from the client side requires the user to be currently signed in (cannot delete other users from client). The best approach is to delete from Firestore immediately and note in the toast that the auth record persists until the user tries to log in again (or admin removes via console). This matches the existing behavior.
- Prominent branding in the header: show the Land Linkers logo (`/assets/generated/` directory or the existing logo path used elsewhere in the app) and "Connecting Spaces" tagline.

### Modify
- User list cards: expand from the current compact 3-line layout to a richer card layout showing all 5 data points (Name, Email/Phone, Role label, Plots count, Joined date).
- Both `onSnapshot` listeners (users + plots) run concurrently so the combined view is always live.
- Delete confirmation dialog: update text to clarify it removes from the Firestore database and their plots remain unless separately deleted.
- The inner Agents/Owners Tabs remain but are enhanced with richer data and sort order.

### Remove
- The "Last Login" display on user cards (replaced by "Joined Date").
- The static non-clickable Total Users stat card (or enhance it to open the Users tab directly).

## Implementation Plan

1. In `AdminPage.tsx`, add a second `onSnapshot` listener on the `plots` collection (alongside the existing users listener) and store plots in state.
2. Compute a `plotCountByUserId` map: for each plot, check `ownerId` field — map it to the user's Firestore document ID. Also match by `ownerEmail`/`loginId` as fallback.
3. When rendering user cards, look up each user's plot count from this map.
4. Sort filtered arrays (agents, owners) by plot count descending before rendering.
5. Enhance user card UI: add Role badge (colored), Plots count chip, and Joined date (from `createdAt` field formatted as "MMM YYYY").
6. Update `AppUser` type in `firebaseStore.ts` to include optional `createdAt` field.
7. Add logo image and "Connecting Spaces" tagline to the Admin Dashboard header area.
8. Keep the Delete flow as-is (Firestore only) but improve the toast message for clarity.
