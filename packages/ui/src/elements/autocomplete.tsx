import { isWeb } from "@tamagui/constants";
import React, { useCallback, useRef, useState, useEffect } from "react";
import { debounce } from "lodash";
import { type PopoverTriggerRef, Trigger as PopoverTrigger } from "@rn-primitives/popover";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Div } from "./layout";
import { Popover, PopoverContent } from "./popover";
import { cn } from "../utils";
import { Pressable } from "react-native";
import type { TextInput } from "./input";
import { Text } from "./text";

interface AutocompleteProps {
  children: React.ReactElement;
  onSelect: (option: string) => void;
  getOptions: () => Promise<void>;
  autocompleteOptions?: string[];
  className?: string;
}

export function Autocomplete({
  children,
  onSelect,
  getOptions,
  autocompleteOptions,
  className,
}: AutocompleteProps) {
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<PopoverTriggerRef>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const insets = useSafeAreaInsets();
  const contentInsets = {
    top: insets.top,
    bottom: insets.bottom,
    left: 12,
    right: 12,
  };

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

  useEffect(() => {
    if (showDropdown && autocompleteOptions && autocompleteOptions.length > 0) {
      triggerRef.current?.open();
    } else if (!isFocused) {
      triggerRef.current?.close();
    }
  }, [showDropdown, autocompleteOptions, isFocused]);

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
      handleInputChange(option);
    },
    [onSelect, handleInputChange]
  );

  const handleFocus = useCallback(() => {
    setShowDropdown(true);
    setIsFocused(true);
    children.props.onFocus?.();
  }, [children.props.onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    children.props.onBlur?.();
  }, [children.props.onBlur]);

  const inputWithAutocomplete = React.cloneElement<React.ComponentProps<typeof TextInput>>(
    children,
    {
      [isWeb ? "onChange" : "onChangeText"]: handleInputChange,
      onFocus: handleFocus,
      onBlur: handleBlur,
    }
  );

  const optionsList = React.useMemo(
    () =>
      autocompleteOptions?.map((option) => (
        <Pressable
          key={option}
          onPress={() => handleSelectOption(option)}
          className="w-full group web:cursor-default web:select-none rounded-sm py-1.5 native:py-2 px-4 web:hover:bg-accent web:outline-none"
        >
          <Text className="web:group-hover:text-accent-foreground text-sm native:text-lg text-popover-foreground native:text-base">
            {option}
          </Text>
        </Pressable>
      )),
    [autocompleteOptions, handleSelectOption]
  );

  return (
    <Div className={cn(className, "w-full")}>
      {inputWithAutocomplete}
      <Popover onOpenChange={(open) => setShowDropdown(open)}>
        <PopoverTrigger ref={triggerRef} className="w-full" />
        <PopoverContent
          insets={contentInsets}
          className={
            showDropdown && autocompleteOptions && autocompleteOptions.length > 0
              ? "w-[--radix-popover-trigger-width] p-1"
              : "hidden"
          }
          animationDuration={0}
        >
          {optionsList}
        </PopoverContent>
      </Popover>
    </Div>
  );
}
