import { TextInput, type TextInputProps } from "react-native";
import { isWeb } from "@tamagui/constants";
import React, { useState, useCallback, useRef } from "react";
import { View, Text, Pressable } from "react-native";
import { debounce } from "lodash";

interface InputProps extends TextInputProps {
  id: string;
  type: string;
  onChange: (...event: unknown[]) => void;
  onBlur: () => void;
  onFocus?: () => void;
}

export function Input({
  id,
  onChange,
  onBlur,
  placeholder,
  value,
  type = "text",
  onFocus,
  ...props
}: InputProps) {
  const inputClasses =
    "px-3 py-2 rounded-md bg-background border-2 border-input flex flex-row ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-primary h-10 w-full";
  const nativeOnChange = type === "text" ? { onChangeText: onChange } : { onChange };
  return isWeb ? (
    <input
      type={type}
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      autoComplete={props.autoComplete}
      autoCorrect={props.autoCorrect?.toString()}
      className={inputClasses}
      placeholder={placeholder}
      onFocus={onFocus}
    />
  ) : (
    <TextInput
      {...props}
      {...nativeOnChange}
      value={value}
      onBlur={onBlur}
      className={inputClasses}
      placeholder={placeholder}
      onFocus={onFocus}
    />
  );
}

interface AutocompleteInputProps {
  children: React.ReactElement;
  onSelect: (value: string) => void;
  getOptions: () => Promise<void>;
  autocompleteOptions?: string[];
}

export function AutocompleteInput({
  children,
  onSelect,
  getOptions,
  autocompleteOptions,
}: AutocompleteInputProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedSearch = useCallback(
    debounce(async (text: string) => {
      if (text.length >= 3) {
        await getOptions();
        setShowDropdown(true);
      } else {
        setShowDropdown(false);
      }
    }, 300),
    []
  );

  const handleInputChange = useCallback(
    (text: string) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        debouncedSearch(text);
      }, 0);

      if (isWeb) {
        children.props.onChange?.(text);
      } else {
        children.props.onChangeText?.(text);
      }
    },
    [debouncedSearch, children.props]
  );

  const handleSelectOption = useCallback(
    (option: string) => {
      setShowDropdown(false);
      onSelect(option);
      children.props.onChange?.(option);
    },
    [children.props.onChange, onSelect]
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    children.props.onFocus?.();
  }, [children.props.onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    children.props.onBlur?.();
  }, [children.props.onBlur]);

  const inputWithAutocomplete = React.cloneElement(children, {
    onChange: handleInputChange,
    onFocus: handleFocus,
    onBlur: handleBlur,
  });

  const dropdownContent = React.useMemo(() => {
    if (showDropdown && isFocused && autocompleteOptions && autocompleteOptions.length > 0) {
      return (
        <View className="absolute w-full mt-12 bg-background border border-border rounded-md shadow-lg">
          {autocompleteOptions.map((option) => (
            <Pressable
              key={option}
              onPress={() => handleSelectOption(option)}
              className="px-3 py-2 hover:bg-accent"
            >
              <Text>{option}</Text>
            </Pressable>
          ))}
        </View>
      );
    }
    return null;
  }, [autocompleteOptions, isFocused, showDropdown, handleSelectOption]);

  return (
    <View className="relative">
      {inputWithAutocomplete}
      {dropdownContent}
    </View>
  );
}
