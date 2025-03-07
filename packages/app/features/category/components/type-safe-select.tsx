import React from "react";
import {
  Select as BaseSelect,
  SelectItem,
  SelectTrigger,
  SelectContent,
  SelectValue,
} from "@dishify/ui";

export interface TypeSafeSelectProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: readonly { value: T; label: string }[];
  placeholder: string;
}

export function TypeSafeSelect<T extends string>({
  value,
  onValueChange,
  options,
  placeholder,
}: TypeSafeSelectProps<T>) {
  const handleValueChange = (option: { value: string; label: string } | undefined) => {
    if (option?.value) {
      onValueChange(option.value as T);
    }
  };

  return (
    <BaseSelect
      value={{ value, label: options.find((opt) => opt.value === value)?.label ?? "" }}
      onValueChange={handleValueChange}
      className="min-w-[120px] sm:min-w-[140px] flex-grow sm:flex-grow-0"
    >
      <SelectTrigger className="h-10">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} label={option.label} />
        ))}
      </SelectContent>
    </BaseSelect>
  );
}
