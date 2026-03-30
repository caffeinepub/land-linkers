import { createContext, useContext } from "react";

export type UserType = "agent" | "owner" | "admin";

export interface AuthContextValue {
  userType: UserType | null;
  onLogout: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  userType: null,
  onLogout: () => {},
});

export const useAuth = () => useContext(AuthContext);
