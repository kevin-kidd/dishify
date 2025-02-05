"use client";

import HomeLayout from "app/features/home/layout";

export default function HomeRouteLayout({ children }: { children: React.ReactNode }) {
  return <HomeLayout>{children}</HomeLayout>;
}
