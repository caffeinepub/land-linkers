import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { AuthContext, type UserType } from "./context/AuthContext";
import { AdminPage } from "./pages/AdminPage";
import { AgentPage } from "./pages/AgentPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { OwnerPage } from "./pages/OwnerPage";
import { PhotoSlideshowPage } from "./pages/PhotoSlideshowPage";
import { ProfilePage } from "./pages/ProfilePage";
import { auth, db } from "./utils/firebase";
import {
  clearPhoneSession,
  getPhoneSession,
  signOutUser,
} from "./utils/firebaseStore";
import type { AppUser } from "./utils/firebaseStore";

const ADMIN_EMAIL = "admin@J";
const ADMIN_PASSWORD = "Guru@4473";
const NEW_LOGO = "/assets/image-019d4503-4266-7396-af3a-623deafe0238.png";

let _userType: UserType | null = null;

function buildRouter(userType: UserType | null) {
  const rootRoute = createRootRoute({
    component: () => (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1">
          <Outlet />
        </div>
        <Footer />
        <Toaster richColors position="top-right" />
      </div>
    ),
  });

  const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: HomePage,
  });

  const agentRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/agent",
    beforeLoad: () => {
      if (!userType) throw redirect({ to: "/" });
      if (userType === "owner") throw redirect({ to: "/owner" });
      if (userType === "admin") throw redirect({ to: "/admin-portal" });
    },
    component: AgentPage,
  });

  const ownerRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/owner",
    beforeLoad: () => {
      if (!userType) throw redirect({ to: "/" });
      if (userType === "agent") throw redirect({ to: "/agent" });
      if (userType === "admin") throw redirect({ to: "/admin-portal" });
    },
    component: OwnerPage,
  });

  const adminPortalRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/admin-portal",
    beforeLoad: () => {
      if (userType !== "admin") throw redirect({ to: "/" });
    },
    component: AdminPage,
  });

  const adminRedirectRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/admin",
    beforeLoad: () => {
      if (userType === "admin") throw redirect({ to: "/admin-portal" });
      throw redirect({ to: "/" });
    },
    component: () => null,
  });

  const profileRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/profile",
    component: ProfilePage,
  });

  const photosRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/photos/$id",
    component: () => {
      const { id } = photosRoute.useParams();
      return <PhotoSlideshowPage photoId={id} />;
    },
  });

  const routeTree = rootRoute.addChildren([
    homeRoute,
    agentRoute,
    ownerRoute,
    adminPortalRoute,
    adminRedirectRoute,
    profileRoute,
    photosRoute,
  ]);

  return createRouter({
    routeTree,
    defaultPreloadStaleTime: 0,
    basepath: "/",
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof buildRouter>;
  }
}

function AdminLoginForm({
  onLogin,
}: {
  onLogin: (
    type: UserType,
    name?: string,
    loginId?: string,
    createdAt?: string,
  ) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      onLogin("admin", "Admin");
    } else {
      setError("Invalid admin credentials. Please try again.");
      toast.error("Invalid admin credentials.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Toaster richColors position="top-right" />
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <img
            src={NEW_LOGO}
            alt="Land Linkers"
            className="w-16 h-16 rounded-2xl mx-auto mb-3 shadow-md"
          />
          <div className="text-3xl font-bold text-green-700 mb-1">
            Land Linkers
          </div>
          <div className="text-sm text-gray-500 tracking-widest uppercase">
            Connecting Spaces
          </div>
          <div className="mt-4 text-lg font-semibold text-gray-800">
            Admin Portal
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Restricted access. Authorised personnel only.
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="adminEmail"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Admin Email
            </label>
            <input
              id="adminEmail"
              type="text"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="Enter admin email"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div>
            <label
              htmlFor="adminPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="adminPassword"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="Enter password"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            type="submit"
            className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            Login as Admin
          </button>
        </form>
        <div className="mt-4 text-center">
          <a
            href="/"
            className="text-sm text-gray-400 hover:text-green-700 transition-colors"
          >
            ← Back to main site
          </a>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const [userLoginId, setUserLoginId] = useState<string | undefined>(undefined);
  const [userCreatedAt, setUserCreatedAt] = useState<string | undefined>(
    undefined,
  );
  // true while we are checking for a persisted session on first load
  const [authChecking, setAuthChecking] = useState(true);
  // Splash screen states
  const [showSplash, setShowSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  const routerRef = useRef<ReturnType<typeof buildRouter> | null>(null);

  // Splash screen timer — always show for 4.5s then fade out
  useEffect(() => {
    const fadeTimer = setTimeout(() => setSplashFading(true), 4500);
    const hideTimer = setTimeout(() => setShowSplash(false), 5000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  // Restore persisted session on mount (runs once)
  useEffect(() => {
    let resolved = false;

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (resolved) return; // only run once on initial load
      resolved = true;

      if (firebaseUser) {
        // Email user with active Firebase Auth session — fetch role from Firestore
        try {
          const userSnap = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userSnap.exists()) {
            const data = userSnap.data() as AppUser;
            const role = data.role;
            const name = data.name;
            const loginId = data.loginId || data.email || data.mobile;
            const createdAt = firebaseUser.metadata?.creationTime || undefined;
            _userType = role;
            routerRef.current = buildRouter(role);
            setUserType(role);
            setUserName(name);
            setUserLoginId(loginId);
            setUserCreatedAt(createdAt);
            setIsLoggedIn(true);
            setAuthChecking(false);
            return;
          }
        } catch {
          // Firestore unavailable — fall through to show login
        }
      }

      // No Firebase Auth session — check phone session cache
      const phoneSession = getPhoneSession();
      if (phoneSession) {
        _userType = phoneSession.role;
        routerRef.current = buildRouter(phoneSession.role);
        setUserType(phoneSession.role);
        setUserName(phoneSession.loginId);
        setUserLoginId(phoneSession.loginId);
        setIsLoggedIn(true);
      }

      setAuthChecking(false);
    });

    return () => unsub();
  }, []);

  const logout = async () => {
    await signOutUser();
    setIsLoggedIn(false);
    setUserType(null);
    setUserName(undefined);
    setUserLoginId(undefined);
    setUserCreatedAt(undefined);
    _userType = null;
    routerRef.current = null;
  };

  const handleLogin = (
    type: UserType,
    name?: string,
    loginId?: string,
    createdAt?: string,
  ) => {
    _userType = type;
    routerRef.current = buildRouter(type);
    const destination = type === "admin" ? "/admin-portal" : "/";
    routerRef.current.navigate({ to: destination });
    setUserType(type);
    setUserName(name);
    setUserLoginId(loginId);
    setUserCreatedAt(createdAt);
    setIsLoggedIn(true);
  };

  // Always show splash for the first 5 seconds
  if (showSplash) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center bg-[#1a3a5c] z-50 transition-opacity duration-500"
        style={{ opacity: splashFading ? 0 : 1 }}
      >
        <img
          src={NEW_LOGO}
          alt="Land Linkers"
          className="w-[120px] h-[120px] rounded-2xl shadow-xl mb-5"
        />
        <div className="text-white text-4xl font-bold mb-2">Land Linkers</div>
        <div className="text-white/70 text-sm tracking-widest uppercase">
          Connecting Spaces
        </div>
      </div>
    );
  }

  // Auth still resolving after splash hides — minimal spinner
  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a3a5c]">
        <Loader2 className="w-8 h-8 animate-spin text-white/60" />
      </div>
    );
  }

  if (!isLoggedIn || !routerRef.current) {
    const path = window.location.pathname;
    const isAdminPortalPath =
      path === "/admin-portal" || path.startsWith("/admin-portal/");

    if (isAdminPortalPath) {
      return <AdminLoginForm onLogin={handleLogin} />;
    }

    return (
      <>
        <Toaster richColors position="top-right" />
        <LoginPage onLogin={handleLogin} />
      </>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        userType,
        userName,
        userLoginId,
        userCreatedAt,
        onLogout: logout,
      }}
    >
      <RouterProvider router={routerRef.current} />
    </AuthContext.Provider>
  );
}
