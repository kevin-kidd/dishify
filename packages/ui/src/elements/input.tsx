import { TextInput, type TextInputProps } from "react-native";
import { isWeb } from "@tamagui/constants";
import React, { useState, useCallback } from "react";
import { View, Text, Pressable } from "react-native";
import { debounce } from "lodash";

interface InputProps extends TextInputProps {
  id: string;
  type: string;
  onChange: (...event: unknown[]) => void;
  onBlur: () => void;
}

export function Input({ id, onChange, onBlur, placeholder, type = "text", ...props }: InputProps) {
  const inputClasses =
    "px-3 py-2 rounded-md bg-background border-2 border-input flex flex-row ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-primary h-10 w-full";
  const nativeOnChange = type === "text" ? { onChangeText: onChange } : { onChange };
  return isWeb ? (
    <input
      type={type}
      id={id}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      autoComplete={props.autoComplete}
      autoCorrect={props.autoCorrect?.toString()}
      className={inputClasses}
      placeholder={placeholder}
    />
  ) : (
    <TextInput
      {...props}
      {...nativeOnChange}
      onBlur={onBlur}
      className={inputClasses}
      placeholder={placeholder}
    />
  );
}

interface AutocompleteInputProps {
  children: React.ReactElement;
  onSelect: (value: string) => void;
  getOptions: () => void;
  autocompleteOptions?: string[];
}

export function AutocompleteInput({
  children,
  onSelect,
  getOptions,
  autocompleteOptions,
}: AutocompleteInputProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const debouncedSearch = useCallback(
    debounce(async (text: string) => {
      if (text.length >= 3) {
        getOptions();
        setShowDropdown(true);
      } else {
        setShowDropdown(false);
      }
    }, 300),
    []
  );

  const handleInputChange = (text: string) => {
    debouncedSearch(text);
    children.props.onChange?.(text);
  };

  const handleSelectOption = (option: string) => {
    setShowDropdown(false);
    onSelect(option);
    children.props.onChange?.(option);
  };

  const inputWithAutocomplete = React.cloneElement(children, {
    onChange: handleInputChange,
  });

  return (
    <View className="relative">
      {inputWithAutocomplete}
      {showDropdown && autocompleteOptions && (
        <View className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg">
          {autocompleteOptions?.map((item) => (
            <Pressable
              key={item}
              onPress={() => handleSelectOption(item)}
              className="px-3 py-2 hover:bg-accent"
            >
              <Text>{item}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
