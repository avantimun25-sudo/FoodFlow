import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { CustomerAuthResponseCustomer } from "@workspace/api-client-react";

interface AuthContextType {
  user: CustomerAuthResponseCustomer | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: CustomerAuthResponseCustomer, token: string) => void;
  logout: () => void;
  updateUser: (user: CustomerAuthResponseCustomer) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomerAuthResponseCustomer | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("delivery_token");
    const storedUser = localStorage.getItem("delivery_customer");

    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (e) {
        console.error("Failed to parse stored user", e);
        localStorage.removeItem("delivery_token");
        localStorage.removeItem("delivery_customer");
      }
    }
    setIsInitialized(true);
  }, []);

  const login = (userData: CustomerAuthResponseCustomer, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("delivery_customer", JSON.stringify(userData));
    localStorage.setItem("delivery_token", authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("delivery_customer");
    localStorage.removeItem("delivery_token");
  };

  const updateUser = (updatedUser: CustomerAuthResponseCustomer) => {
    setUser(updatedUser);
    localStorage.setItem("delivery_customer", JSON.stringify(updatedUser));
  };

  if (!isInitialized) return null;

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
