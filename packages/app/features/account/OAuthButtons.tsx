"use client";

import { Button, LI, Tooltip, TooltipContent, TooltipGroup, TooltipTrigger, UL } from "@dishify/ui";
import { Facebook, Google, Microsoft } from "@dishify/ui/src/icons/social";
import type React from "react";

export function OAuthButtons() {
  return (
    <TooltipGroup>
      <UL className="flex flex-row gap-4 justify-center">
        <LI className="z-30">
          <OAuthButton
            Icon={Google}
            onPress={() => console.log("XD")}
            label="Sign in with Google"
          />
        </LI>
        <LI className="z-20">
          <OAuthButton
            Icon={Microsoft}
            onPress={() => console.log("XD")}
            label="Sign in with Microsoft"
          />
        </LI>
        <LI className="z-20">
          <OAuthButton
            Icon={Facebook}
            onPress={() => console.log("XD")}
            label="Sign in with Facebook"
          />
        </LI>
      </UL>
    </TooltipGroup>
  );
}

function OAuthButton({
  Icon,
  onPress,
  label,
}: {
  Icon: React.ElementType;
  onPress: () => void;
  label: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger delayDuration={300}>
        <Button
          aria-label={label}
          role="link"
          onPress={onPress}
          className="h-12 w-12 rounded-lg border border-sage-400 bg-background p-3 hover:bg-sage-100 2xl:h-14 2xl:w-14 2xl:p-[0.875rem] transition-colors duration-200"
        >
          <Icon className="h-full w-full" />
        </Button>
      </TooltipTrigger>
      <TooltipContent position="top">{label}</TooltipContent>
    </Tooltip>
  );
}
