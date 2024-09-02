import { Text, View } from "react-native";
import { withWebTag } from "../utils/web-tag";

export const Form = withWebTag(View, "form");

export const Label = withWebTag(Text, "label", "text-sm font-semibold text-primary 2xl:text-base");

export const ErrorLabel = withWebTag(Text, "label", "text-xs text-red-500 2xl:text-sm");

interface FormInputProps {
  label?: string;
  optional?: boolean;
  error?: string;
  id: string;
  children: React.ReactNode;
}

export const FormInput = ({ label, optional, error, id, children }: FormInputProps) => {
  return (
    <View className="flex-1 w-full flex-col gap-1 z-10">
      {(!!label || !!error) && (
        <View className="mb-1 flex-1 flex-row items-end justify-between">
          <Label htmlFor={id}>{label}</Label>

          {/* Error */}
          {error ? (
            <ErrorLabel>{error}</ErrorLabel>
          ) : optional ? (
            <Label className="text-xs text-secondary 2xl:text-sm">optional</Label>
          ) : null}
        </View>
      )}
      {children}
    </View>
  );
};
