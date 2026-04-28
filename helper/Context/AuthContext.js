import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

const AuthContext = createContext();

const AUTH_STORAGE_KEY = "adminAuth";

const getStoredAuth = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!storedAuth) {
    return null;
  }

  try {
    return JSON.parse(storedAuth);
  } catch (error) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedAuth = getStoredAuth();

    if (savedAuth) {
      setUser(savedAuth);
    }

    setIsLoading(false);
  }, []);

  const login = (authData = {}) => {
    const session = {
      email: authData?.email || "",
      token:
        authData?.token ||
        authData?.accessToken ||
        authData?.jwt ||
        authData?.data?.token ||
        authData?.data?.accessToken ||
        authData?.data?.jwt ||
        "",
      user: authData?.user || authData?.data?.user || null,
      raw: authData,
    };

    setUser(session);

    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));

      if (session.email) {
        localStorage.setItem("email", session.email);
      }

      if (session.token) {
        localStorage.setItem("kudavasalToken", session.token);
      } else {
        localStorage.removeItem("kudavasalToken");
      }
    }
  };

  const logout = () => {
    setUser(null);

    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem("kudavasalToken");
      localStorage.removeItem("email");
    }

    router.push("/");
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
