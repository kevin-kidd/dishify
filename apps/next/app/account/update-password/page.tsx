import { UpdatePasswordScreen } from "@dishify/app/features/account/update-password/screen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dishify - Update password",
  description: "Update your password here",
};

export default function UpdatePassword() {
  return <UpdatePasswordScreen />;
}
