import { useEffect, useState } from "react";
import { authClient } from "../auth/client";

export const useAuth = () => {
  const { useSession, updateUser, signIn, signOut, signUp } = authClient;
  const [isSignedIn, setIsSignedIn] = useState<"fetching" | "signed-in" | "signed-out">("fetching");
  const session = useSession();

  useEffect(() => {
    if (session.isPending) return;
    if (session.data?.user) {
      setIsSignedIn("signed-in");
    } else {
      setIsSignedIn("signed-out");
    }
  }, [session]);
  return {
    useSession,
    updateUser,
    signIn,
    signOut,
    signUp,
    isSignedIn,
    session,
    isPending: session.isPending,
  };
};
