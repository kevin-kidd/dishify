import { authClient } from "../auth/client";

export const useAuth = () => {
  const { useSession, updateUser, signIn, signOut, signUp } = authClient;

  return { useSession, updateUser, signIn, signOut, signUp };
};
