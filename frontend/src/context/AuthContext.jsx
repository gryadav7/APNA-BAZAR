import { useState, useEffect, useCallback } from "react";
import authService from "../services/authService";
import AuthContext from "./authContextInstance";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore authenticated session on application mount via HTTP-only cookie
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const data = await authService.getCurrentUser();
        if (isMounted && data?.success && data?.user) {
          setUser(data.user);
        } else if (isMounted) {
          setUser(null);
        }
      } catch {
        // 401 or network error - unauthenticated
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Check auth on demand
  const checkAuth = useCallback(async () => {
    try {
      const data = await authService.getCurrentUser();
      if (data?.success && data?.user) {
        setUser(data.user);
        return data.user;
      }
      setUser(null);
      return null;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  // Login method
  const login = async (email, password) => {
    const data = await authService.login(email, password);
    if (data?.success && data?.user) {
      setUser(data.user);
      return data.user;
    }
    throw new Error(data?.message || "Login failed");
  };

  // Register method
  const register = async (userData) => {
    const data = await authService.register(userData);
    return data;
  };

  // Logout method
  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Proceed even if server request fails
    } finally {
      setUser(null);
    }
  };

  // Update current user state helper
  const updateUser = (userData) => {
    setUser((prev) => (prev ? { ...prev, ...userData } : userData));
  };

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    role: user?.role || null,
    login,
    register,
    logout,
    updateUser,
    checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
