import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Text } from "react-native"
import { Button, Form, FormInput, cn } from "@dishify/ui"
import { useAtomValue } from "jotai"
import { appColorSchemeAtom } from "app/atoms/theme"
import * as Burnt from "burnt"

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
  })
  const appColorScheme = useAtomValue(appColorSchemeAtom)
  const onSubmit = handleSubmit((data) => {
    Burnt.toast({
      title: "Success",
      preset: "done",
      message: "You have successfully signed in!",
    })
    console.log(data)
  })
  return (
    <Form className="flex flex-col gap-y-4 mt-4">
      <Controller
        name="email"
        control={control}
        rules={{
          required: true,
        }}
        render={({ field: { onChange, onBlur, name, value } }) => (
          <FormInput
            type="email"
            autoComplete="email"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            autoCorrect={false}
            error={errors.email?.message}
            label="Email"
            id={name}
          />
        )}
      />
      <Controller
        name="password"
        control={control}
        rules={{
          maxLength: 100,
        }}
        render={({ field: { onChange, onBlur, name, value } }) => (
          <FormInput
            type="password"
            id={name}
            onBlur={onBlur}
            onChangeText={onChange}
            secureTextEntry={true}
            value={value}
            autoCorrect={false}
            error={errors.password?.message}
            autoCapitalize="none"
            autoComplete="current-password"
            label="Password"
          />
        )}
      />
      <Button
        onPress={onSubmit}
        aria-label="Submit"
        className="flex w-full h-10 items-center justify-center gap-2 rounded-md bg-light-blue text-center transition ease-in-out hover:bg-light-blue/90"
      >
        <Text className={appColorScheme === "dark" ? "text-primary" : "text-background"}>
          Submit
        </Text>
      </Button>
    </Form>
  )
}

type SignInFormValues = {
  email: string
  password: string
}

const formSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  password: z.string().min(1, "Password is required"),
})
