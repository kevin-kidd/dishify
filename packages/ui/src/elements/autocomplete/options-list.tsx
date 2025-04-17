import React from "react";
import { View, Platform } from "react-native";
import { Text } from "../../elements/text";
import { cn } from "../../utils";
import type { OptionItemProps, OptionsListProps } from "./types";
import { Search } from "../../icons/search";
import { Button } from "../button";

export const OptionsList = React.memo(
  ({ options, selectedIndex, onSelect, setIsOptionClicking }: OptionsListProps) => (
    <View className="w-full rounded-xl bg-white border border-sage-200 shadow-lg shadow-sage-500/5 p-1 pb-2 sm:px-2 animate-in fade-in-0 duration-300">
      <Text className="py-2 pl-2 text-xs font-semibold text-sage-500">Suggestions</Text>
      {options.map((option, index) => (
        <OptionItem
          key={option}
          option={option}
          onPress={onSelect}
          isSelected={index === selectedIndex}
          setIsOptionClicking={setIsOptionClicking}
        />
      ))}
    </View>
  ),
);

interface OptionItemWithClickingProps extends OptionItemProps {
  setIsOptionClicking?: (val: boolean) => void;
}

/**
 * OptionItem renders a selectable option in the autocomplete dropdown.
 * Handles mouse/touch events to prevent input blur from closing the drawer prematurely.
 */
export const OptionItem = React.memo(
  ({ option, onPress, isSelected, setIsOptionClicking }: OptionItemWithClickingProps) => {
    // Handler for mouse/touch down to signal an option is being clicked
    const handlePointerDown = () => {
      setIsOptionClicking?.(true);
    };
    // Handler for click to select the option and reset clicking state
    const handlePress = () => {
      onPress(option);
      setTimeout(() => setIsOptionClicking?.(false), 0); // Reset after event
    };

    // For web, wrap Button in a span to attach pointer events
    if (Platform.OS === "web") {
      return (
        <span onMouseDown={handlePointerDown} onTouchStart={handlePointerDown} className="block">
          <Button
            variant="none"
            key={option}
            onPress={handlePress}
            className={cn(
              "w-full flex-1 flex-row justify-start gap-2 sm:gap-0 items-center group web:cursor-pointer transition-colors duration-100 ease-in-out web:select-none rounded-lg py-1.5 native:py-2 px-2 sm:px-4 web:hover:bg-sage-100 web:outline-none",
              isSelected && "bg-sage-100",
            )}
          >
            <Search className="h-4 w-4 sm:hidden text-sage-400" />
            <Text
              className={cn(
                "text-sm native:text-lg text-sage-900 text-popover-foreground native:text-base",
              )}
            >
              {option}
            </Text>
          </Button>
        </span>
      );
    }

    // Native platforms: just render Button
    return (
      <Button
        variant="none"
        key={option}
        onPress={handlePress}
        className={cn(
          "w-full flex-1 flex-row justify-start gap-2 sm:gap-0 items-center group web:cursor-default transition-colors duration-100 ease-in-out web:select-none rounded-lg py-1.5 native:py-2 px-2 sm:px-4 web:hover:bg-sage-100 web:outline-none",
          isSelected && "bg-sage-100",
        )}
      >
        <Search className="h-4 w-4 sm:hidden text-sage-400" />
        <Text
          className={cn(
            "text-sm native:text-lg text-sage-900 text-popover-foreground native:text-base",
          )}
        >
          {option}
        </Text>
      </Button>
    );
  },
);
