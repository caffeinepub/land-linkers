# Land Linkers

## Current State
- App has a splash screen tied to `authChecking` state (only shows while Firebase session is being verified)
- Logo used: `/assets/generated/land-linkers-logo-new.png`
- manifest.json references `land-linkers-icon-clean.dim_512x512.png`
- Two newly uploaded images exist: `image-019d44cd-1f75-759d-ae5d-c40086039009.png` (newer) and `image-019d4503-4266-7396-af3a-623deafe0238.png`

## Requested Changes (Diff)

### Add
- Proper `SplashScreen` component that shows on every app launch for 5 seconds then fades out
- The splash screen must work independently of the `authChecking` state — it always shows for the full duration
- During the splash duration, `authChecking` runs in parallel; once both are done (splash 5s + auth check), proceed to login or dashboard
- Smooth fade-out CSS transition before routing to the next screen

### Modify
- Replace all instances of old logo (`land-linkers-logo-new.png`) with the new uploaded image: `/assets/image-019d44cd-1f75-759d-ae5d-c40086039009.png`
- Update `manifest.json` icons to reference the new image path
- AdminLoginForm logo image → new image
- App.tsx splash → new image

### Remove
- Old logo references (`land-linkers-logo-new.png`) from all display locations

## Implementation Plan
1. In `App.tsx`, add a `showSplash` state initialized to `true`
2. Use `useEffect` with `setTimeout(5000)` to set `showSplash = false`
3. Show `SplashScreen` component when `showSplash === true` (regardless of authChecking)
4. When `showSplash` becomes `false` AND `authChecking` is also false, render the correct view
5. The SplashScreen has a fade-out animation triggered as the 5s timer ends
6. Splash screen layout: centered logo, 'Land Linkers' title, 'Connecting Spaces' tagline on dark background
7. Update all logo `src` attributes to `/assets/image-019d44cd-1f75-759d-ae5d-c40086039009.png`
8. Update `manifest.json` icons `src` to `/assets/image-019d44cd-1f75-759d-ae5d-c40086039009.png`
