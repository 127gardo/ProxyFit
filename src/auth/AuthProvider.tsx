import { Session, User } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import React, { createContext, useContext, useEffect, useState } from "react";

import { supabase } from "../lib/supabase";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;

  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;

  sendPasswordResetEmail: (email: string) => Promise<any>;
  updatePassword: (newPassword: string) => Promise<any>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/*
  Supabase password reset links send tokens back to the app.

  This helper looks inside the deep link URL and pulls out:
  - access_token
  - refresh_token

  Those tokens temporarily log the user in so they are allowed to create
  a new password.
*/
function getTokensFromUrl(url: string) {
  const hashPart = url.includes("#") ? url.split("#")[1] : "";
  const queryPart = url.includes("?") ? url.split("?")[1] : "";

  const params = new URLSearchParams(hashPart || queryPart);

  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (!accessToken || !refreshToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
  };
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStartingSession() {
      const { data } = await supabase.auth.getSession();

      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    }

    loadStartingSession();

    /*
      This listens for Supabase login/logout changes.

      Example:
      - User logs in
      - User logs out
      - User opens a password reset link
    */
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    async function handleDeepLink(url: string) {
      const tokens = getTokensFromUrl(url);

      if (!tokens) {
        return;
      }

      /*
        For password reset, Supabase sends tokens in the link.

        setSession tells Supabase:
        "This is the user who clicked the reset link."

        After this, reset-password.tsx can safely call updatePassword().
      */
      const { error } = await supabase.auth.setSession({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      });

      if (error) {
        console.log("Error setting password reset session:", error.message);
      }
    }

    /*
      Handles the case where the app was closed and opened from the reset link.
    */
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    /*
      Handles the case where the app was already open when the reset link
      was tapped.
    */
    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  function signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
  }

  function signUp(email: string, password: string) {
    return supabase.auth.signUp({ email, password });
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  function sendPasswordResetEmail(email: string) {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "proxyfit://reset-password",
    });
  }

  function updatePassword(newPassword: string) {
    return supabase.auth.updateUser({
      password: newPassword,
    });
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        signIn,
        signUp,
        signOut,
        sendPasswordResetEmail,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
