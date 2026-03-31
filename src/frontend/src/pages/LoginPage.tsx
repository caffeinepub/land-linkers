import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LogIn,
  MapPin,
  Shield,
  UserPlus,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { UserType } from "../context/AuthContext";
import { loginUser, registerUser } from "../utils/firebaseStore";

interface LoginPageProps {
  onLogin: (userType: UserType) => void;
}

type Screen =
  | "auth-choice"
  | "select"
  | "login"
  | "forgot-id"
  | "forgot-otp"
  | "signup-select"
  | "signup-form";

export function LoginPage({ onLogin }: LoginPageProps) {
  const [screen, setScreen] = useState<Screen>("auth-choice");
  const [selectedRole, setSelectedRole] = useState<UserType | null>(null);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password flow
  const [forgotRole, setForgotRole] = useState<UserType | null>(null);
  const [forgotLoginId, setForgotLoginId] = useState("");
  const [otp, setOtp] = useState("");

  // Signup flow
  const [signupRole, setSignupRole] = useState<UserType | null>(null);
  const [signupName, setSignupName] = useState("");
  const [signupLoginId, setSignupLoginId] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirm, setShowSignupConfirm] = useState(false);

  const handleRoleSelect = (role: UserType) => {
    setSelectedRole(role);
    setLoginError(null);
    setScreen("login");
  };

  // ─── LOGIN: strict Firestore check ────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginId.trim() || !password) {
      setLoginError("Please enter your email/mobile and password.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginUser(loginId.trim(), password);

      if (result.status === "not-found") {
        setLoginError("Account not found. Please Sign Up first.");
        return;
      }

      if (result.status === "wrong-password") {
        setLoginError("Incorrect password. Please enter correct details.");
        return;
      }

      // success — use the role stored in the database
      if (result.user) {
        toast.success("Welcome back!");
        onLogin(result.user.role);
      }
    } catch {
      setLoginError(
        "Unable to connect. Please check your internet and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ─── SIGNUP: save to Firestore first, then grant access ───────────────
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signupName.trim().length < 2) {
      toast.error("Please enter your full name.");
      return;
    }
    if (signupLoginId.trim().length < 5) {
      toast.error("Please enter a valid email or mobile number.");
      return;
    }
    if (signupPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (signupPassword !== signupConfirm) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await registerUser({
        name: signupName.trim(),
        loginId: signupLoginId.trim(),
        password: signupPassword,
        role: signupRole as "owner" | "agent",
      });

      if (!result.success) {
        toast.error(result.error ?? "Registration failed. Please try again.");
        return;
      }

      toast.success("Account created! Welcome to Land Linkers.");
      onLogin(signupRole!);
    } catch {
      toast.error(
        "Unable to connect. Please check your internet and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotRole) {
      toast.error("Please select your user type.");
      return;
    }
    if (forgotLoginId.length < 5) {
      toast.error("Please enter a valid email or mobile number.");
      return;
    }
    toast.success(`OTP sent to your email/mobile: ${forgotLoginId}`);
    setScreen("forgot-otp");
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit OTP.");
      return;
    }
    toast.error(
      "Password reset via OTP is not available. Please contact support.",
    );
    setScreen("login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background decorative blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-20 left-10 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-10 right-20 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md mx-4"
      >
        <div className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
          {/* Header stripe */}
          <div className="bg-navy px-8 py-8 flex flex-col items-center gap-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg"
            >
              {selectedRole === "admin" ? (
                <Shield className="w-8 h-8 text-white" />
              ) : (
                <MapPin className="w-8 h-8 text-white" />
              )}
            </motion.div>
            <div className="text-center">
              <h1 className="font-serif font-bold text-white text-2xl leading-tight">
                Land Linkers
              </h1>
              <p className="text-white/60 text-xs tracking-widest uppercase mt-1">
                The Land Hub
              </p>
            </div>
          </div>

          <div className="px-8 py-8">
            <AnimatePresence mode="wait">
              {/* ── AUTH CHOICE SCREEN (initial) ── */}
              {screen === "auth-choice" && (
                <motion.div
                  key="auth-choice"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <h2 className="text-foreground font-semibold text-xl mb-1 text-center">
                    Welcome to Land Linkers
                  </h2>
                  <p className="text-muted-foreground text-sm mb-8 text-center">
                    Your gateway to land listings and property deals
                  </p>

                  <div className="space-y-4">
                    {/* Primary: Create Account */}
                    <button
                      type="button"
                      onClick={() => setScreen("signup-select")}
                      className="w-full flex items-center justify-center gap-3 p-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-base transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                      data-ocid="auth.create_account_button"
                    >
                      <UserPlus className="w-5 h-5" />
                      Create Account
                    </button>

                    {/* Secondary: Login */}
                    <button
                      type="button"
                      onClick={() => setScreen("select")}
                      className="w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-primary text-primary hover:bg-primary/5 font-semibold text-base transition-all active:scale-[0.98]"
                      data-ocid="auth.login_button"
                    >
                      <LogIn className="w-5 h-5" />
                      Login
                    </button>
                  </div>

                  <p className="text-center text-xs text-muted-foreground mt-6">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setScreen("select")}
                      className="text-primary hover:underline font-medium"
                      data-ocid="auth.login_link"
                    >
                      Sign in here
                    </button>
                  </p>
                </motion.div>
              )}

              {/* ── ROLE SELECTION SCREEN (Login) ── */}
              {screen === "select" && (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <button
                    type="button"
                    onClick={() => setScreen("auth-choice")}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
                    data-ocid="login.back_button"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>

                  <h2 className="text-foreground font-semibold text-lg mb-1 text-center">
                    Welcome back
                  </h2>
                  <p className="text-muted-foreground text-sm mb-8 text-center">
                    Choose how you want to log in
                  </p>

                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => handleRoleSelect("agent")}
                      className="w-full flex items-center gap-4 p-5 rounded-xl border-2 border-border hover:border-navy bg-background hover:bg-navy/5 transition-all group"
                      data-ocid="login.agent_button"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center text-2xl transition-colors shrink-0">
                        🤝
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-foreground text-base">
                          Agent
                        </div>
                        <div className="text-muted-foreground text-xs mt-0.5">
                          Login as a land broker or agent
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRoleSelect("owner")}
                      className="w-full flex items-center gap-4 p-5 rounded-xl border-2 border-border hover:border-navy bg-background hover:bg-navy/5 transition-all group"
                      data-ocid="login.owner_button"
                    >
                      <div className="w-12 h-12 rounded-full bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center text-2xl transition-colors shrink-0">
                        🏠
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-foreground text-base">
                          Owner
                        </div>
                        <div className="text-muted-foreground text-xs mt-0.5">
                          Login as a plot owner
                        </div>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── LOGIN FORM ── */}
              {screen === "login" && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setScreen("select");
                      setLoginError(null);
                    }}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
                    data-ocid="login.back_button"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>

                  <div className="flex items-center gap-2 mb-5">
                    <span className="text-xl">
                      {selectedRole === "agent" ? "🤝" : "🏠"}
                    </span>
                    <div>
                      <h2 className="text-foreground font-semibold text-lg leading-tight">
                        {selectedRole === "agent"
                          ? "Agent Login"
                          : "Owner Login"}
                      </h2>
                      <p className="text-muted-foreground text-xs">
                        Sign in with your registered details
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                    data-ocid="login.modal"
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor="loginId" className="text-sm font-medium">
                        Email or Mobile Number
                      </Label>
                      <Input
                        id="loginId"
                        type="text"
                        placeholder="email@example.com or +91 9000000000"
                        value={loginId}
                        onChange={(e) => {
                          setLoginId(e.target.value);
                          setLoginError(null);
                        }}
                        className="bg-background border-border"
                        required
                        disabled={isLoading}
                        data-ocid="login.input"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-sm font-medium">
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setLoginError(null);
                          }}
                          className="bg-background border-border pr-10"
                          required
                          disabled={isLoading}
                          data-ocid="login.input"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Inline error message */}
                    <AnimatePresence>
                      {loginError && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-red-700 text-sm leading-snug">
                              {loginError}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                      data-ocid="login.submit_button"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Verifying…
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </button>

                    <AnimatePresence>
                      {loginError ===
                        "Account not found. Please Sign Up first." && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setLoginError(null);
                              setScreen("signup-select");
                            }}
                            className="w-full text-sm text-primary hover:text-primary/80 font-semibold text-center transition-colors py-1 border border-primary/30 rounded-lg bg-primary/5 hover:bg-primary/10"
                            data-ocid="login.signup_redirect_button"
                          >
                            Create a new account →
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      type="button"
                      onClick={() => setScreen("forgot-id")}
                      className="w-full text-xs text-muted-foreground hover:text-primary text-center transition-colors"
                      data-ocid="login.forgot_button"
                    >
                      Forgot Password?
                    </button>
                  </form>
                </motion.div>
              )}

              {/* ── SIGNUP ROLE SELECTION ── */}
              {screen === "signup-select" && (
                <motion.div
                  key="signup-select"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <button
                    type="button"
                    onClick={() => setScreen("auth-choice")}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
                    data-ocid="signup.back_button"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>

                  <h2 className="text-foreground font-semibold text-lg mb-1 text-center">
                    Create Your Account
                  </h2>
                  <p className="text-muted-foreground text-sm mb-8 text-center">
                    Select your role to get started
                  </p>

                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSignupRole("agent");
                        setScreen("signup-form");
                      }}
                      className="w-full flex items-center gap-4 p-5 rounded-xl border-2 border-border hover:border-primary bg-background hover:bg-primary/5 transition-all group"
                      data-ocid="signup.agent_button"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center text-2xl transition-colors shrink-0">
                        🤝
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-foreground text-base">
                          Agent
                        </div>
                        <div className="text-muted-foreground text-xs mt-0.5">
                          Register as a land broker or agent
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSignupRole("owner");
                        setScreen("signup-form");
                      }}
                      className="w-full flex items-center gap-4 p-5 rounded-xl border-2 border-border hover:border-primary bg-background hover:bg-primary/5 transition-all group"
                      data-ocid="signup.owner_button"
                    >
                      <div className="w-12 h-12 rounded-full bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center text-2xl transition-colors shrink-0">
                        🏠
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-foreground text-base">
                          Owner
                        </div>
                        <div className="text-muted-foreground text-xs mt-0.5">
                          Register as a plot owner
                        </div>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── SIGNUP FORM ── */}
              {screen === "signup-form" && (
                <motion.div
                  key="signup-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <button
                    type="button"
                    onClick={() => setScreen("signup-select")}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
                    data-ocid="signup.back_button"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>

                  <div className="flex items-center gap-2 mb-5">
                    <span className="text-xl">
                      {signupRole === "agent" ? "🤝" : "🏠"}
                    </span>
                    <div>
                      <h2 className="text-foreground font-semibold text-lg leading-tight">
                        {signupRole === "agent" ? "Agent" : "Owner"}{" "}
                        Registration
                      </h2>
                      <p className="text-muted-foreground text-xs">
                        Fill in your details to create your account
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={handleSignupSubmit}
                    className="space-y-4"
                    data-ocid="signup.modal"
                  >
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="signupName"
                        className="text-sm font-medium"
                      >
                        Full Name
                      </Label>
                      <Input
                        id="signupName"
                        type="text"
                        placeholder="Enter your full name"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        className="bg-background border-border"
                        required
                        disabled={isLoading}
                        data-ocid="signup.input"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="signupLoginId"
                        className="text-sm font-medium"
                      >
                        Email or Mobile Number
                      </Label>
                      <Input
                        id="signupLoginId"
                        type="text"
                        placeholder="email@example.com or +91 9000000000"
                        value={signupLoginId}
                        onChange={(e) => setSignupLoginId(e.target.value)}
                        className="bg-background border-border"
                        required
                        disabled={isLoading}
                        data-ocid="signup.input"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="signupPassword"
                        className="text-sm font-medium"
                      >
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="signupPassword"
                          type={showSignupPassword ? "text" : "password"}
                          placeholder="Create a password (min. 6 characters)"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          className="bg-background border-border pr-10"
                          required
                          disabled={isLoading}
                          data-ocid="signup.input"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowSignupPassword(!showSignupPassword)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showSignupPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="signupConfirm"
                        className="text-sm font-medium"
                      >
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="signupConfirm"
                          type={showSignupConfirm ? "text" : "password"}
                          placeholder="Re-enter your password"
                          value={signupConfirm}
                          onChange={(e) => setSignupConfirm(e.target.value)}
                          className="bg-background border-border pr-10"
                          required
                          disabled={isLoading}
                          data-ocid="signup.input"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowSignupConfirm(!showSignupConfirm)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showSignupConfirm ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors mt-2 flex items-center justify-center gap-2"
                      data-ocid="signup.submit_button"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating Account…
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </button>

                    <p className="text-center text-xs text-muted-foreground">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setScreen("select")}
                        className="text-primary hover:underline font-medium"
                        data-ocid="signup.login_link"
                      >
                        Sign in
                      </button>
                    </p>
                  </form>
                </motion.div>
              )}

              {/* ── FORGOT — STEP 1 ── */}
              {screen === "forgot-id" && (
                <motion.div
                  key="forgot-id"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <button
                    type="button"
                    onClick={() => setScreen("login")}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                    data-ocid="login.back_button"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to login
                  </button>

                  <h2 className="font-semibold text-lg text-foreground mb-1">
                    Reset Password
                  </h2>
                  <p className="text-muted-foreground text-sm mb-5">
                    Select your role and enter your login ID to receive an OTP.
                  </p>

                  <div className="flex gap-3 mb-5" data-ocid="login.tab">
                    {(["owner", "agent"] as UserType[]).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setForgotRole(role)}
                        className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all capitalize ${
                          forgotRole === role
                            ? "bg-navy text-white border-navy shadow-md"
                            : "bg-background text-foreground border-border hover:border-navy/50"
                        }`}
                        data-ocid={`login.forgot.${role}.toggle`}
                      >
                        {role === "owner" ? "🏠 Owner" : "🤝 Agent"}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="forgot-id"
                        className="text-sm font-medium"
                      >
                        Email or Mobile Number
                      </Label>
                      <Input
                        id="forgot-id"
                        type="text"
                        placeholder="email@example.com or +91 9000000000"
                        value={forgotLoginId}
                        onChange={(e) => setForgotLoginId(e.target.value)}
                        className="bg-background border-border"
                        required
                        data-ocid="login.input"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 rounded-lg transition-colors"
                      data-ocid="login.submit_button"
                    >
                      Send OTP
                    </button>
                  </form>
                </motion.div>
              )}

              {/* ── FORGOT — STEP 2: OTP ── */}
              {screen === "forgot-otp" && (
                <motion.div
                  key="forgot-otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <button
                    type="button"
                    onClick={() => setScreen("forgot-id")}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                    data-ocid="login.back_button"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <KeyRound className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg text-foreground leading-tight">
                        Enter OTP
                      </h2>
                      <p className="text-muted-foreground text-xs">
                        Check your email or SMS
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="otp" className="text-sm font-medium">
                        6-digit OTP
                      </Label>
                      <Input
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) =>
                          setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        className="bg-background border-border tracking-widest text-center text-lg font-mono"
                        required
                        data-ocid="login.input"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 rounded-lg transition-colors"
                      data-ocid="login.submit_button"
                    >
                      Verify & Login
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
