"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Button,
  Form,
  FormInput,
  TextInput,
  Div,
  Text,
} from "@dishify/ui/src";
import * as React from "react";
import { useAuth } from "app/utils/hooks/use-auth";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "app/utils/toast";
import { authClient } from "app/utils/auth/client";

type AccountSettingsPopupProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

type AccountSettingsFormValues = {
  name: string;
  email: string;
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
};

const formSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().min(1, "Email is required").email("Invalid email"),
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
    confirmNewPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.newPassword && !data.currentPassword) {
        return false;
      }
      if (data.newPassword && data.newPassword !== data.confirmNewPassword) {
        return false;
      }
      return true;
    },
    {
      message: "New passwords must match and current password is required to change password",
      path: ["confirmNewPassword"],
    },
  );

export default function AccountSettingsPopup({ isOpen, setIsOpen }: AccountSettingsPopupProps) {
  const { useSession } = useAuth();
  const { data: session } = useSession();
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AccountSettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: session?.user?.name || "",
      email: session?.user?.email || "",
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Update user information
      if (data.name !== session?.user?.name) {
        const { error: updateError } = await authClient.updateUser({
          name: data.name,
        });
        if (updateError) throw updateError;
      }

      // Change email if it's different
      if (data.email !== session?.user?.email) {
        const { error: emailError } = await authClient.changeEmail({
          newEmail: data.email,
          callbackURL: "/account/settings",
        });
        if (emailError) throw emailError;
      }

      // Change password if provided
      if (data.newPassword && data.currentPassword) {
        const { error: passwordError } = await authClient.changePassword({
          newPassword: data.newPassword,
          currentPassword: data.currentPassword,
          revokeOtherSessions: true,
        });
        if (passwordError) throw passwordError;
      }

      toast.success("Success", {
        description: "Your account settings have been updated successfully!",
      });
      setIsOpen(false);
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to update account settings",
      });
    }
  });

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Account Settings</SheetTitle>
          <SheetDescription>
            Update your account information and manage your password
          </SheetDescription>
        </SheetHeader>

        <Form onSubmit={onSubmit} className="space-y-6 py-6">
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <FormInput error={errors.name?.message} label="Name" id="name">
                <TextInput
                  {...field}
                  className="w-full"
                  textContentType="name"
                  autoComplete="name"
                />
              </FormInput>
            )}
          />

          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <FormInput error={errors.email?.message} label="Email" id="email">
                <TextInput
                  {...field}
                  className="w-full"
                  textContentType="emailAddress"
                  autoComplete="email"
                />
              </FormInput>
            )}
          />

          <Div className="space-y-4">
            <Button
              role="button"
              variant="outline"
              onPress={() => setIsChangingPassword(!isChangingPassword)}
            >
              <Text>{isChangingPassword ? "Cancel Password Change" : "Change Password"}</Text>
            </Button>

            {isChangingPassword && (
              <>
                <Controller
                  name="currentPassword"
                  control={control}
                  render={({ field }) => (
                    <FormInput
                      error={errors.currentPassword?.message}
                      label="Current Password"
                      id="currentPassword"
                    >
                      <TextInput
                        {...field}
                        className="w-full"
                        textContentType="password"
                        secureTextEntry={true}
                        autoComplete="current-password"
                      />
                    </FormInput>
                  )}
                />

                <Controller
                  name="newPassword"
                  control={control}
                  render={({ field }) => (
                    <FormInput
                      error={errors.newPassword?.message}
                      label="New Password"
                      id="newPassword"
                    >
                      <TextInput
                        {...field}
                        className="w-full"
                        textContentType="password"
                        secureTextEntry={true}
                        autoComplete="new-password"
                      />
                    </FormInput>
                  )}
                />

                <Controller
                  name="confirmNewPassword"
                  control={control}
                  render={({ field }) => (
                    <FormInput
                      error={errors.confirmNewPassword?.message}
                      label="Confirm New Password"
                      id="confirmNewPassword"
                    >
                      <TextInput
                        {...field}
                        className="w-full"
                        textContentType="password"
                        secureTextEntry={true}
                        autoComplete="new-password"
                      />
                    </FormInput>
                  )}
                />
              </>
            )}
          </Div>

          <Div className="flex flex-row justify-end space-x-4">
            <Button role="button" variant="outline" onPress={() => setIsOpen(false)}>
              <Text>Cancel</Text>
            </Button>
            <Button role="button" onPress={onSubmit}>
              <Text>Save Changes</Text>
            </Button>
          </Div>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
