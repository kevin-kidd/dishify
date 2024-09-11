import { isWeb } from "@tamagui/constants";
import React, { useCallback, useRef, useState, useEffect } from "react";
import { debounce } from "lodash";
import type { PopoverTriggerRef } from "@rn-primitives/popover";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Div } from "./layout";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "../utils";
import { Pressable, findNodeHandle } from "react-native";
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
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<PopoverTriggerRef>(null);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const [inputValue, setInputValue] = useState("");

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
        // Only fetch options if the user has typed at least 3 characters
        await getOptions();
      } else {
        triggerRef.current?.close?.();
      }
    }, 300),
    []
  );

  const handleInputChange = useCallback(
    (text: string) => {
      debouncedSearch(text);
      if (isWeb) {
        children.props.onChange?.(text);
      } else {
        children.props.onChangeText?.(text);
      }
      setInputValue(text);
      if (!isOpen) {
        triggerRef.current?.open?.();
      }
    },
    [debouncedSearch, children.props, isOpen]
  );

  const handleSelectOption = useCallback(
    (option: string) => {
      onSelect(option);
      handleInputChange(option);
      triggerRef.current?.close?.();
    },
    [onSelect, handleInputChange]
  );

  const handleFocus = useCallback(() => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    triggerRef.current?.open?.();
    children.props.onFocus?.();
  }, [children.props.onFocus]);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const handleInteractOutside = useCallback((e: any) => {
    if (isWeb) {
      // Web-specific check
      const inputElement = inputRef.current as unknown as HTMLInputElement;
      if (inputElement && (e.target === inputElement || inputElement.contains(e.target as Node))) {
        return; // Do nothing if the interaction is within the input
      }
    } else {
      // React Native-specific check
      const inputHandle = findNodeHandle(inputRef.current);
      if (inputHandle && e.target === inputHandle) {
        return; // Do nothing if the interaction is with the input
      }
    }
    e.preventDefault();
    triggerRef.current?.close?.();
  }, []);

  const inputWithAutocomplete = React.cloneElement<React.ComponentProps<typeof TextInput>>(
    children,
    {
      [isWeb ? "onChange" : "onChangeText"]: handleInputChange,
      onFocus: handleFocus,
      ref: inputRef,
      // onBlur: handleBlur,
    }
  );

  const optionsList = React.useMemo(
    () =>
      autocompleteOptions?.map((option) => (
        <OptionItem key={option} option={option} onPress={handleSelectOption} />
      )),
    [autocompleteOptions, handleSelectOption]
  );

  // TODO: add keyboard navigation

  return (
    <Div className={cn(className, "w-full")}>
      {inputWithAutocomplete}
      <Popover onOpenChange={setIsOpen}>
        <PopoverTrigger ref={triggerRef} className="w-full" />
        <PopoverContent
          onFocusOutside={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={handleInteractOutside}
          onPointerDownOutside={(e) => e.preventDefault()}
          insets={contentInsets}
          className={
            isOpen &&
            autocompleteOptions &&
            autocompleteOptions.length > 0 &&
            inputValue.length >= 3 &&
            inputValue.slice(0, 3) === autocompleteOptions[0].slice(0, 3)
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

const OptionItem = React.memo(
  ({ option, onPress }: { option: string; onPress: (option: string) => void }) => (
    <Pressable
      key={option}
      onPress={() => onPress(option)}
      className="w-full group web:cursor-default web:select-none rounded-sm py-1.5 native:py-2 px-4 web:hover:bg-accent web:outline-none"
    >
      <Text className="web:group-hover:text-accent-foreground text-sm native:text-lg text-popover-foreground native:text-base">
        {option}
      </Text>
    </Pressable>
  )
);
