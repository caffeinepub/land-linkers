import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { useRef, useState } from "react";
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

const ADMIN_EMAIL = "admin@J";
const ADMIN_PASSWORD = "Guru@4473";

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
      if (userType === "owner") throw redirect({ to: "/owner" });
      if (userType === "admin") throw redirect({ to: "/admin-portal" });
    },
    component: AgentPage,
  });

  const ownerRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/owner",
    beforeLoad: () => {
      if (userType === "agent") throw redirect({ to: "/agent" });
      if (userType === "admin") throw redirect({ to: "/admin-portal" });
    },
    component: OwnerPage,
  });

  // /admin-portal — only accessible to admin
  const adminPortalRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/admin-portal",
    beforeLoad: () => {
      if (userType !== "admin") throw redirect({ to: "/" });
    },
    component: AdminPage,
  });

  // /admin — admins go to /admin-portal; all other users go to home (Login page)
  const adminRedirectRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/admin",
    beforeLoad: () => {
      if (userType === "admin") throw redirect({ to: "/admin-portal" });
      // Non-admins and guests redirect to home (which is the Login page for logged-out users)
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

function AdminLoginForm({ onLogin }: { onLogin: (type: UserType) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      onLogin("admin");
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
          <div className="text-3xl font-bold text-green-700 mb-1">
            Land Linkers
          </div>
          <div className="text-sm text-gray-500">The Land Hub</div>
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
  const routerRef = useRef<ReturnType<typeof buildRouter> | null>(null);

  const logout = () => {
    setIsLoggedIn(false);
    setUserType(null);
    _userType = null;
    routerRef.current = null;
  };

  const handleLogin = (type: UserType) => {
    _userType = type;
    routerRef.current = buildRouter(type);
    const destination = type === "admin" ? "/admin-portal" : "/";
    routerRef.current.navigate({ to: destination });
    setUserType(type);
    setIsLoggedIn(true);
  };

  if (!isLoggedIn || !routerRef.current) {
    const path = window.location.pathname;

    // ONLY /admin-portal shows the dedicated admin login form.
    // /admin and any other URL shows the regular Login page.
    const isAdminPortalPath =
      path === "/admin-portal" || path.startsWith("/admin-portal/");

    if (isAdminPortalPath) {
      return <AdminLoginForm onLogin={handleLogin} />;
    }

    // Everyone else (including /admin visitors) sees the regular Login page.
    return (
      <>
        <Toaster richColors position="top-right" />
        <LoginPage onLogin={handleLogin} />
      </>
    );
  }

  return (
    <AuthContext.Provider value={{ userType, onLogout: logout }}>
      <RouterProvider router={routerRef.current} />
    </AuthContext.Provider>
  );
}
