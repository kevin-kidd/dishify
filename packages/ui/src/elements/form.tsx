import { ComponentProps } from "react"
import { TextInput, Text, View } from "react-native"
import { withWebTag } from "../utils/web-tag"
import { isWeb } from "@tamagui/constants"

export const Form = withWebTag(View, "form")

export const Label = withWebTag(Text, "label", "text-sm font-semibold text-primary 2xl:text-base")

export const ErrorLabel = withWebTag(Text, "label", "text-xs text-red-500 2xl:text-sm")

export const FormInput = ({
  label,
  optional,
  error,
  id,
  type,
  onChangeText,
  onBlur,
  ...props
}: ComponentProps<typeof TextInput> & {
  id: string
  type: string
  onChangeText: (...event: unknown[]) => void
  onBlur: () => void
  label?: string
  optional?: boolean
  error?: string
}) => {
  const inputClasses =
    "px-3 py-2 rounded-md bg-background border-2 border-input flex flex-row ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-primary h-10 w-full"
  return (
    <View className="flex w-full flex-col gap-1">
      <View className="mb-1 flex flex-row items-end justify-between">
        <Label htmlFor={id}>{label}</Label>

        {/* Error */}
        {error ? (
          <ErrorLabel>{error}</ErrorLabel>
        ) : optional ? (
          <Label className="text-xs text-secondary 2xl:text-sm">optional</Label>
        ) : null}
      </View>

      {/* Text Input */}
      {isWeb ? (
        <input
          type={type}
          id={id}
          onChange={(e) => onChangeText(e.target.value)}
          onBlur={onBlur}
          autoComplete={props.autoComplete}
          autoCorrect={props.autoCorrect?.toString()}
          className={inputClasses}
        />
      ) : (
        <TextInput {...props} onChangeText={onChangeText} onBlur={onBlur} className={inputClasses}>
          {props.children}
        </TextInput>
      )}
    </View>
  )
}
