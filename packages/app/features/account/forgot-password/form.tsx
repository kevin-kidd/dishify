"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Text } from "react-native";
import { Button, Form, FormInput, TextInput } from "@dishify/ui";
import { toast } from "app/utils/toast";
import { authClient } from "app/utils/auth/client";

export function ForgotPasswordForm() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });
  const onSubmit = handleSubmit(async (data) => {
    const { error } = await authClient.forgetPassword({
      email: data.email,
      redirectTo: "/account/update-password",
    });
    if (error) {
      toast.error("Error", {
        description: error.message,
      });
    } else {
      toast.success("Success", {
        description: "You have successfully signed in!",
      });
    }
  });
  return (
    <Form className="flex flex-col gap-y-4 mt-4 w-full">
      <Controller
        name="email"
        control={control}
        rules={{
          required: true,
        }}
        render={({ field: { onChange, onBlur, name, value } }) => (
          <FormInput error={errors.email?.message} label="Email" id={name}>
            <TextInput
              className="w-full"
              inputMode="email"
              textContentType="emailAddress"
              onBlur={onBlur}
              onChange={onChange}
              value={value}
              autoComplete="email"
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
        <Text className="text-background">Reset Password</Text>
      </Button>
    </Form>
  );
}

type ForgotPasswordFormValues = {
  email: string;
};

const formSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
});
