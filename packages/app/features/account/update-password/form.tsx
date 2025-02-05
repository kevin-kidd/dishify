"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Text } from "react-native";
import { Button, Form, FormInput, TextInput } from "@dishify/ui";
import { toast } from "app/utils/toast";
import { passwordSchema } from "app/utils/auth";
import { PasswordRequirements } from "../sign-up/password-requirements";
import { useState } from "react";
import { authClient } from "app/utils/auth/client";
import { useSearchParams } from "solito/navigation";
import { useRouter } from "solito/navigation";
export function UpdatePasswordForm() {
  const params = useSearchParams();
  const token = params?.get("token");
  const error = params?.get("error");
  const router = useRouter();
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });
  if (!token || error) {
    router.push("/account/forgot-password");
    toast.error("Error", {
      description: error || "Invalid token",
    });
    return;
  }
  const onSubmit = handleSubmit(async (data) => {
    const { error } = await authClient.resetPassword({
      newPassword: data.password,
      token: token,
    });
    if (error) {
      console.log(error);
      toast.error("Error", {
        description: error.message,
      });
      return;
    }
    toast.success("Success", {
      description: "You have successfully updated your password!",
    });
    router.push("/");
  });
  return (
    <Form className="flex flex-col gap-y-4 mt-4 w-full">
      <Controller
        name="password"
        control={control}
        rules={{
          required: true,
        }}
        render={({ field: { onChange, onBlur, name, value } }) => (
          <FormInput error={errors.password?.message} label="Password" id={name}>
            <TextInput
              className="w-full"
              textContentType="password"
              onBlur={() => {
                setShowPasswordRequirements(false);
                onBlur();
              }}
              onFocus={() => {
                setShowPasswordRequirements(true);
              }}
              onChange={onChange}
              value={value}
              autoComplete="current-password"
              autoCorrect={false}
            />
          </FormInput>
        )}
      />
      <PasswordRequirements
        errorCodes={errors.password?.message}
        passwordLength={getValues("password").length}
        isVisible={showPasswordRequirements}
      />
      <Controller
        name="confirmPassword"
        control={control}
        rules={{
          required: true,
        }}
        render={({ field: { onChange, onBlur, name, value } }) => (
          <FormInput error={errors.confirmPassword?.message} label="Confirm Password" id={name}>
            <TextInput
              className="w-full"
              textContentType="password"
              onBlur={onBlur}
              onChange={onChange}
              value={value}
              autoComplete="current-password"
              autoCorrect={false}
            />
          </FormInput>
        )}
      />

      <Button
        onClick={onSubmit}
        aria-label="Submit"
        className="flex w-full h-10 items-center justify-center gap-2 rounded-md text-center transition ease-in-out"
      >
        <Text className="text-background">Update Password</Text>
      </Button>
    </Form>
  );
}

type UpdatePasswordFormValues = {
  password: string;
  confirmPassword: string;
};

const formSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string().min(1, "Confirm password is required"),
});
