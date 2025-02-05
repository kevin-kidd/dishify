import { TRPCProvider as TRPCProviderOG } from "../../utils/trpc/index.native";

export const TRPCProvider = ({ children }: { children: React.ReactNode }): React.ReactNode => {
  return <TRPCProviderOG>{children}</TRPCProviderOG>;
};
