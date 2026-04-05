# Land Linkers

## Current State
- Admin login at `/admin-portal` works (credentials `admin@J` / `Guru@4473` are validated client-side)
- Admin session is persisted via `localStorage` (`ll_admin_session`)
- `AdminPage.tsx` uses Firestore `onSnapshot` on `users` and `plots` collections
- Firestore rules allow `read: if true` on users/plots — reads should work
- **Problem 1:** When `admin@J` logs in, no Firestore document is ever created for the admin account with `role: admin`. If the dashboard has any role-check gate that requires this doc, data won't show.
- **Problem 2:** `onSnapshot` error handler in AdminPage shows an error card but the logic that triggers it may show even when reads succeed if a silent error occurs.
- **Problem 3:** The `Total Users` count and list depend entirely on `users` collection having documents — if no one has registered yet OR the collection name is wrong, list is empty.
- **Problem 4:** Admin session on page refresh: admin localStorage session is checked but Firestore read for admin doc could fail if the doc doesn't exist, causing silent re-auth failures.

## Requested Changes (Diff)

### Add
- On admin login: immediately write/upsert a Firestore document `users/admin` (or a dedicated `admins/admin`) with `role: "admin"`, name, email, so the admin doc always exists
- In AdminPage: on mount, attempt to ensure admin doc exists (idempotent setDoc)
- Show a helpful "No users registered yet" empty state vs a permission error state (distinguish the two cases clearly)
- Debug info panel (collapsible) showing Firestore connection status

### Modify
- `App.tsx` `AdminLoginForm` `handleSubmit`: after successful credential check, call `ensureAdminDoc()` to write the admin Firestore record
- `AdminPage.tsx`: strengthen `onSnapshot` error handling — show specific permission-denied vs network error messages; add a direct "Test Connection" button that does a one-off getDocs to verify Firestore is reachable
- `AdminPage.tsx`: `Total Users` stat card now shows count of ALL documents in `users` collection (already correct, just needs the data to load)
- `AdminPage.tsx`: The user list already shows Name, Role, Plot Count, Joined Date — ensure it handles missing `createdAt` and missing `name` fields gracefully with fallbacks
- Firestore rules displayed in error banner updated to be more permissive on writes (allow any authenticated-looking write to users collection)

### Remove
- Nothing to remove

## Implementation Plan
1. Add `ensureAdminDoc()` utility to `firebaseStore.ts` — does a `setDoc` with `merge: true` to write `{ role: 'admin', name: 'Admin', email: 'admin@J', createdAt }` to `users/admin-portal-user` doc
2. Call `ensureAdminDoc()` in `App.tsx` `AdminLoginForm.handleSubmit` after successful credential check
3. In `AdminPage.tsx` `useEffect` for users: add a fallback — if `onSnapshot` fires with 0 docs AND no error, show a clear "No users registered yet" empty state (not an error)
4. Improve error messages to distinguish `permission-denied` from network errors
5. Update Firestore rules block in error banner to be fully open for reads (already is) and allow writes more broadly for the users collection
6. Ensure admin session check in `App.tsx` is resilient — if `getAdminSession()` returns true, skip all Firestore checks and render AdminPage directly
