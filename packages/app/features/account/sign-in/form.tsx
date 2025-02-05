"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Text } from "react-native";
import { Button, Div, Form, FormInput, TextInput } from "@dishify/ui";
import { toast } from "app/utils/toast";
import { Link } from "solito/link";
import { authClient } from "app/utils/auth/client";
import { useRouter } from "solito/navigation";

export function SignInForm() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const router = useRouter();

  const onSubmit = handleSubmit(async (data) => {
    const { error } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    });
    if (error) {
      console.log(error);
      toast.error("Error", {
        description: error.message,
      });
    } else {
      router.push("/");
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
      <Controller
        name="password"
        control={control}
        rules={{
          maxLength: 100,
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <Div className="flex flex-col gap-1.5">
            <Div className="flex flex-row justify-between items-center">
              <Text
                nativeID="password-label"
                className="text-sm native:text-base font-medium text-foreground"
              >
                Password
              </Text>
              <Link href="/account/forgot-password">
                <Text className="text-sage-500 text-xs font-normal">Forgot password?</Text>
              </Link>
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
        onPress={onSubmit}
        aria-label="Submit"
        className="flex w-full h-10 items-center justify-center gap-2 rounded-md text-center transition ease-in-out"
      >
        <Text className="text-background">Sign in</Text>
      </Button>
    </Form>
  );
}

type SignInFormValues = {
  email: string;
  password: string;
};

const formSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});
