import { isWeb } from "@tamagui/constants";
import React, { useCallback, useRef, useState, useEffect } from "react";
import { debounce } from "lodash";
import type { PopoverTriggerRef } from "@rn-primitives/popover";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Div } from "./layout";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
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
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<PopoverTriggerRef>(null);
  const [isOpen, setIsOpen] = useState(false);

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
    },
    [debouncedSearch, children.props]
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

  const handleBlur = useCallback(() => {
    blurTimeoutRef.current = setTimeout(() => {
      triggerRef.current?.close?.();
      children.props.onBlur?.();
    }, 500);
  }, [children.props.onBlur]);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

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
        <OptionItem key={option} option={option} onPress={handleSelectOption} />
      )),
    [autocompleteOptions, handleSelectOption]
  );

  return (
    <Div className={cn(className, "w-full")}>
      {inputWithAutocomplete}
      <Popover onOpenChange={setIsOpen}>
        <PopoverTrigger ref={triggerRef} className="w-full" />
        <PopoverContent
          onFocusOutside={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          insets={contentInsets}
          className={
            isOpen && autocompleteOptions && autocompleteOptions.length > 0
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
