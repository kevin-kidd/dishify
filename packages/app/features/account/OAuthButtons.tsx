"use client";

import { Button, LI, Tooltip, TooltipContent, TooltipGroup, TooltipTrigger, UL } from "@dishify/ui";
import { Discord, Google, Microsoft } from "@dishify/ui/src/icons/social";
import { authClient } from "app/utils/auth/client";
import type React from "react";

export function OAuthButtons() {
  const signInWithGoogle = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: process.env.NEXT_PUBLIC_APP_URL,
    });
  };

  const signInWithMicrosoft = async () => {
    await authClient.signIn.social({
      provider: "microsoft",
      callbackURL: process.env.NEXT_PUBLIC_APP_URL,
    });
  };

  const signInWithDiscord = async () => {
    await authClient.signIn.social({
      provider: "discord",
      callbackURL: process.env.NEXT_PUBLIC_APP_URL,
    });
  };

  return (
    <TooltipGroup>
      <UL className="flex flex-row gap-4 justify-center">
        <LI className="z-30">
          <OAuthButton Icon={Google} onAction={signInWithGoogle} label="Sign in with Google" />
        </LI>
        <LI className="z-20">
          <OAuthButton
            Icon={Microsoft}
            onAction={signInWithMicrosoft}
            label="Sign in with Microsoft"
          />
        </LI>
        <LI className="z-20">
          <OAuthButton Icon={Discord} onAction={signInWithDiscord} label="Sign in with Discord" />
        </LI>
      </UL>
    </TooltipGroup>
  );
}

function OAuthButton({
  Icon,
  onAction,
  label,
}: {
  Icon: React.ElementType;
  onAction: () => void;
  label: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger delayDuration={300} asChild>
        <Button
          variant="none"
          aria-label={label}
          role="link"
          onClick={onAction}
          className="h-12 w-12 rounded-lg border border-sage-400 bg-background p-3 hover:bg-sage-100 2xl:h-14 2xl:w-14 2xl:p-[0.875rem] transition-colors duration-200"
        >
          <Icon className="h-full w-full" />
        </Button>
      </TooltipTrigger>
      <TooltipContent position="top">{label}</TooltipContent>
    </Tooltip>
  );
}
