import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";

export function useAuth() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  
  // Optional: Fetch user details if authenticated
  // We can add a specialized query for this later if needed
  // const user = useQuery(api.users.current);

  return {
    isLoading,
    isAuthenticated,
    signIn,
    signOut,
  };
}
