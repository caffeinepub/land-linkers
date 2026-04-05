# Land Linkers

## Current State
Admin Dashboard uses Firestore `onSnapshot` on the `users` collection and filters displayed lists to only show `role === 'agent'` and `role === 'owner'` users. Test accounts created via Firebase Auth get their Firestore documents stored under their Firebase Auth UID. The admin panel may not be seeing these documents if:
- The user's Firestore document has no `role` field, or it is stored in a different collection than `users`
- The `ensureAdminDoc` only writes the admin's own record, not the test accounts
- No console logging exists to diagnose what data is actually being returned

## Requested Changes (Diff)

### Add
- Console logging throughout admin data fetch: log total docs returned, each user's id/role/email/name on load
- Debug diagnostic: on each `onSnapshot` trigger, log `snapshot.docs.length` and each doc's raw data to console
- `ensureAdminDoc` also creates/updates the two test accounts (Agent & Owner) in Firestore if they don't exist (only if no agent/owner users are found, as a fallback seed)
- A visible "Debug Info" section in the Admin Dashboard showing raw user count, collection name being queried, and a list of all raw documents with their IDs and role fields
- `getAllUsersRaw` helper that fetches ALL docs from `users` collection and logs them

### Modify
- Admin Dashboard user display: show ALL users from Firestore including those with unrecognized/missing role values (not just 'agent'/'owner') — put unrecognized roles in an "Other" tab or show them alongside
- The `agentUsers` and `ownerUsers` filters remain but add an "All Users" fallback tab that shows everything when agent+owner lists are both empty
- `ensureAdminDoc` now also accepts a `seedTestData` flag; when the users collection is empty (besides admin), it writes seed test documents so admin can always see something

### Remove
- Nothing removed

## Implementation Plan
1. Update `firebaseStore.ts`: add `getAllUsersDebug()` function that fetches all users and returns raw data with console logging
2. Update `AdminPage.tsx`:
   - Add `console.log` calls in both `onSnapshot` callbacks showing total count and each doc's data
   - Add a debug info card below stats showing: collection name queried, total docs in snapshot, and a raw list of all user docs with id + role + email
   - Change user tab logic: if both agentUsers and ownerUsers are empty but `users` array has entries (e.g. missing role), show an "All" tab with every non-admin user
   - Remove the `u.id !== 'admin-portal-user'` filter from `realUserCount` temporarily (or keep it but also show those users) so we can see what's there
3. Update `ensureAdminDoc` to also write two seed test user documents if no agent/owner users exist
