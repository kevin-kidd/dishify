import { TRPCProvider as TRPCProviderOG } from "../../utils/trpc/index.web";

export const TRPCProvider = ({ children }: { children: React.ReactNode }): React.ReactNode => {
  return <TRPCProviderOG>{children}</TRPCProviderOG>;
};
