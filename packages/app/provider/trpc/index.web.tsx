import { TRPCProvider as TRPCProviderOG } from "../../utils/trpc/index";

export const TRPCProvider = ({ children }: { children: React.ReactNode }): React.ReactNode => {
  return <TRPCProviderOG>{children}</TRPCProviderOG>;
};
