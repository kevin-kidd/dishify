import { isWeb } from "@tamagui/constants";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Div } from "./layout";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "../utils";
import { Pressable } from "react-native";
import type { TextInput } from "./input";
import { Text } from "./text";
import { useAutocomplete } from "../utils/hooks/autocomplete";

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
  const {
    triggerRef,
    inputRef,
    isOpen,
    setIsOpen,
    inputValue,
    selectedIndex,
    handleInputChange,
    handleSelectOption,
    handleFocus,
    handleInteractOutside,
    handleKeyPress,
  } = useAutocomplete({ onSelect, getOptions, autocompleteOptions, children });

  const insets = useSafeAreaInsets();
  const contentInsets = {
    top: insets.top,
    bottom: insets.bottom,
    left: 12,
    right: 12,
  };

  const inputWithAutocomplete = React.cloneElement<React.ComponentProps<typeof TextInput>>(
    children,
    {
      [isWeb ? "onChange" : "onChangeText"]: handleInputChange,
      onFocus: handleFocus,
      ref: inputRef,
      onKeyPress: isWeb ? handleKeyPress : undefined,
    }
  );

  const optionsList = React.useMemo(
    () =>
      autocompleteOptions?.map((option, index) => (
        <OptionItem
          key={option}
          option={option}
          onPress={handleSelectOption}
          isSelected={index === selectedIndex}
        />
      )),
    [autocompleteOptions, handleSelectOption, selectedIndex]
  );

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
          onOpenAutoFocus={(e) => e.preventDefault()}
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
  ({
    option,
    onPress,
    isSelected,
  }: { option: string; onPress: (option: string) => void; isSelected: boolean }) => (
    <Pressable
      key={option}
      onPress={() => onPress(option)}
      className={cn(
        "w-full group web:cursor-default web:select-none rounded-sm py-1.5 native:py-2 px-4 web:hover:bg-accent web:outline-none",
        isSelected && "bg-accent"
      )}
    >
      <Text
        className={cn(
          "web:group-hover:text-accent-foreground text-sm native:text-lg text-popover-foreground native:text-base",
          isSelected && "text-accent-foreground"
        )}
      >
        {option}
      </Text>
    </Pressable>
  )
);
