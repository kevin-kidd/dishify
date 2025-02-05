import React from "react";
import { Pressable, View } from "react-native";
import { Text } from "../../elements/text";
import { cn } from "../../utils";
import type { OptionItemProps, OptionsListProps } from "./types";
import { Search } from "../../icons/search";
import { Button } from "../button";

export const OptionsList = React.memo(({ options, selectedIndex, onSelect }: OptionsListProps) => (
  <View className="w-full rounded-xl border border-sage-200 shadow-lg shadow-sage-500/5 p-1 pb-2 sm:px-2 animate-in fade-in-0 duration-300">
    <Text className="py-2 pl-2 text-xs font-semibold text-sage-500">Suggestions</Text>
    {options.map((option, index) => (
      <OptionItem
        key={option}
        option={option}
        onPress={onSelect}
        isSelected={index === selectedIndex}
      />
    ))}
  </View>
));

export const OptionItem = React.memo(({ option, onPress, isSelected }: OptionItemProps) => (
  <Button
    variant="none"
    key={option}
    onClick={() => onPress(option)}
    className={cn(
      "w-full flex-1 flex-row gap-2 sm:gap-0 items-center group web:cursor-default transition-colors duration-100 ease-in-out web:select-none rounded-lg py-1.5 native:py-2 px-2 sm:px-4 web:hover:bg-sage-100 web:outline-none",
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
));
