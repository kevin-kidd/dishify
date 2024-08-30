import { trpc } from "app/utils/trpc/index.web"
import { useSessionContext } from "./useSessionContext"

export const useUser = () => {
  const { session, isLoading } = useSessionContext()
  const user = session?.user
  return {
    session,
    user,
    isLoading,
  }
}
