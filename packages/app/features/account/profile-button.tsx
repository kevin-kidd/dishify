"use client";

import * as React from "react";
import {
  Button,
  cn,
  Div,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Span,
  Text,
} from "@dishify/ui/src";
import { useAuth } from "app/utils/hooks/use-auth";
import { Heart, LogOut, Settings, User } from "lucide-react-native";
import { Pressable } from "react-native";
import { useRouter } from "solito/navigation";
import { useState } from "react";
import AccountSettingsPopup from "./account-settings-popup";

export default function ProfileButton() {
  const { useSession, signOut } = useAuth();
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  if (isPending) {
    return null;
  }

  if (!session?.user) {
    return (
      <Pressable
        href="/account/sign-in"
        className={cn(
          "relative group inline-flex flex-row items-center justify-center",
          "px-6 py-3 text-sm font-medium tracking-wide",
          "transition-all duration-300 ease-out",
          "rounded-full",
          "backdrop-blur-sm",
          "bg-sage-500 text-white",
          "hover:scale-105",
          "active:scale-95",
          "shadow-[0_0_10px_rgba(98,148,105,1)]",
          "hover:shadow-[0_0_15px_rgba(98,148,105,1)]",
        )}
      >
        <Div className="relative flex items-center gap-2 flex-row">
          <User className="w-4 h-4 text-background" />
          <Span className="relative z-10 font-medium text-background">Sign in</Span>
        </Div>
      </Pressable>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex items-center focus:outline-none"
          aria-label="Open profile menu"
        >
          <Div
            className={cn(
              "relative group inline-flex flex-row items-center justify-center",
              "p-3 rounded-full aspect-square text-sm font-medium tracking-wide",
              "transition-all duration-300 ease-out",
              "backdrop-blur-sm",
              "bg-sage-500 text-white",
              "hover:scale-105",
              "active:scale-95",
              "shadow-[0_0_10px_rgba(98,148,105,1)]",
              "hover:shadow-[0_0_15px_rgba(98,148,105,1)]",
            )}
          >
            <User
              className="w-6 h-6 text-background group-hover:text-sage-50 
                             transition-colors duration-300"
            />
          </Div>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="absolute right-0 mt-3 w-56 rounded-xl bg-white/95 backdrop-blur-xl 
                     shadow-xl border border-gray-100/50 py-2 animate-scale-in
                     before:absolute before:-inset-1 before:bg-gradient-to-r 
                     before:from-blue-50/20 before:to-purple-50/20 before:rounded-xl 
                     before:blur-xl before:-z-10 hover:cursor-default"
        >
          <Div className="px-4 py-3 flex flex-col gap-1">
            <Text className="text-sm font-medium text-gray-900">{session.user.name}</Text>
            <Text className="text-xs text-gray-500 mt-0.5 truncate">{session.user.email}</Text>
          </Div>
          <DropdownMenuSeparator className="bg-sage-100" />

          <Button
            variant="none"
            onPress={() => setIsSettingsOpen(true)}
            className="w-full px-4 py-2.5 text-left items-center text-sm text-gray-700 
                           hover:bg-sage-100 flex justify-start space-x-3 
                           transition-all duration-200 hover:text-gray-900 flex-row rounded-lg"
          >
            <Settings className="w-4 h-4 text-gray-500" />
            <Span className="font-medium">Manage Account</Span>
          </Button>

          <Button
            variant="none"
            onPress={() => router.push("/favorites")}
            className="w-full px-4 py-2.5 text-left items-center text-sm text-gray-700 
                           hover:bg-sage-100 flex justify-start space-x-3 
                           transition-all duration-200 hover:text-gray-900 flex-row rounded-lg"
          >
            <Heart className="w-4 h-4 text-gray-500" />
            <Span className="font-medium">View Favorites</Span>
          </Button>

          <DropdownMenuSeparator className="bg-sage-100" />

          <Button
            variant="none"
            onClick={() => signOut()}
            className="w-full px-4 py-2.5 text-left text-sm text-red-600 
                     hover:bg-red-50/80 rounded-lg flex items-center justify-start space-x-3 
                     transition-all duration-200 hover:text-red-700 flex-row"
          >
            <LogOut className="w-4 h-4" />
            <Span className="font-medium" onClick={() => signOut()}>
              Sign out
            </Span>
          </Button>
        </DropdownMenuContent>
      </DropdownMenu>
      {isSettingsOpen && (
        <AccountSettingsPopup isOpen={isSettingsOpen} setIsOpen={setIsSettingsOpen} />
      )}
    </>
  );
}
