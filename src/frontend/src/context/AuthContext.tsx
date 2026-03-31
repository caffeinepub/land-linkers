import { createContext, useContext } from "react";

export type UserType = "agent" | "owner" | "admin";

export interface AuthContextValue {
  userType: UserType | null;
  userName?: string;
  userLoginId?: string;
  userCreatedAt?: string;
  onLogout: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  userType: null,
  userName: undefined,
  userLoginId: undefined,
  userCreatedAt: undefined,
  onLogout: () => {},
});

export const useAuth = () => useContext(AuthContext);
