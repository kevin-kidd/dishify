"use client";

import { Button, Text } from "@dishify/ui";
import Link from "next/link";
import HomeLayout from "@dishify/app/features/home/layout";
import * as Sentry from "@sentry/nextjs";

export default function NotFound() {
  // Report 404 errors to Sentry
  Sentry.captureMessage("404 - Page not found", "warning");

  return (
    <HomeLayout>
      <main className="flex flex-col h-full w-full items-center justify-center gap-6 my-12">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="max-w-[350px] text-center">
          The page you are looking for does not exist. Please check the URL and try again.
        </p>
        <Link href="/">
          <Button>
            <Text>Return Home</Text>
          </Button>
        </Link>
      </main>
    </HomeLayout>
  );
}
