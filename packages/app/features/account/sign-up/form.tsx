"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Text } from "react-native";
import { Button, Div, Form, FormInput, Label, TextInput } from "@dishify/ui";
import { toast } from "app/utils/toast";
import { passwordSchema } from "app/utils/auth";
import { PasswordRequirements } from "./password-requirements";
import { useState } from "react";
import { authClient } from "app/utils/auth/client";
import { useRouter } from "solito/navigation";

export function SignUpForm() {
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors, submitCount },
    getValues,
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const onSubmit = handleSubmit(async (data) => {
    const { error } = await authClient.signUp.email({
      email: data.email,
      password: data.password,
      name: data.name,
    });
    if (error) {
      console.log(error);
      toast.error("Error", {
        description: error.message,
      });
    } else {
      router.push("/");
      toast.success("Success", {
        description: "A confirmation email has been sent to you.",
      });
    }
  });

  return (
    <Form className="flex flex-col gap-y-4 mt-4 w-full">
      <Controller
        name="name"
        control={control}
        rules={{
          required: true,
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <Div className="flex flex-col gap-1.5">
            <Div className="flex flex-row justify-between items-center">
              <Text
                nativeID="name-label"
                className="text-sm native:text-base font-medium text-foreground"
              >
                Name
              </Text>
              {errors.name && submitCount > 0 && (
                <Label className="text-red-500 text-sm font-normal">{errors.name.message}</Label>
              )}
            </Div>
            <TextInput
              className="w-full"
              inputMode="text"
              textContentType="name"
              onBlur={onBlur}
              onChange={onChange}
              value={value}
              autoComplete="name"
              autoCorrect={false}
            />
          </Div>
        )}
      />
      <Controller
        name="email"
        control={control}
        rules={{
          required: true,
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <Div className="flex flex-col gap-1.5">
            <Div className="flex flex-row justify-between items-center">
              <Text
                nativeID="email-label"
                className="text-sm native:text-base font-medium text-foreground"
              >
                Email
              </Text>
              {errors.email && submitCount > 0 && (
                <Label className="text-red-500 text-sm font-normal">{errors.email.message}</Label>
              )}
            </Div>
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
          </Div>
        )}
      />
      <Controller
        name="password"
        control={control}
        rules={{
          maxLength: 100,
        }}
        render={({ field: { onChange, onBlur, name, value } }) => (
          <FormInput label="Password" id={name}>
            <TextInput
              textContentType="password"
              autoCapitalize="none"
              autoComplete="current-password"
              onBlur={() => {
                setShowPasswordRequirements(false);
                onBlur();
              }}
              onFocus={() => {
                setShowPasswordRequirements(true);
              }}
              onChange={onChange}
              secureTextEntry={true}
              value={value}
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
          maxLength: 100,
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <Div className="flex flex-col gap-1.5">
            <Div className="flex flex-row justify-between items-center">
              <Text
                nativeID="confirm-password-label"
                className="text-sm native:text-base font-medium text-foreground"
              >
                Confirm password
              </Text>
              {errors.confirmPassword && submitCount > 0 && (
                <Label className="text-red-500 text-sm font-normal">
                  {errors.confirmPassword.message}
                </Label>
              )}
            </Div>
            <TextInput
              textContentType="password"
              autoCapitalize="none"
              autoComplete="current-password"
              onBlur={onBlur}
              onChange={onChange}
              secureTextEntry={true}
              value={value}
            />
          </Div>
        )}
      />
      <Button
        onClick={onSubmit}
        aria-label="Submit"
        className="flex w-full h-10 items-center justify-center gap-2 rounded-md text-center transition ease-in-out"
      >
        <Text className="text-background">Sign up</Text>
      </Button>
    </Form>
  );
}

type SignUpFormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const formSchema = z
  .object({
    email: z.string().min(1, "Email is required").email("Invalid email"),
    name: z.string().min(1, "Name is required"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((schema) => schema.confirmPassword === schema.password, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });
