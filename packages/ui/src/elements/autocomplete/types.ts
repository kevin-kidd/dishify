import type { ReactElement } from "react";
import type { ViewProps } from "react-native";

export interface AutocompleteProps extends ViewProps {
  children: ReactElement;
  onSelect: (value: string) => void;
  getOptions: (query: string) => Promise<void>;
  autocompleteOptions?: string[];
  isInteractive?: boolean;
  onTemporaryChange?: (value: string) => void;
  className?: string;
}

export interface OptionsListProps {
  options: string[];
  selectedIndex: number;
  onSelect: (option: string) => void;
  setIsOptionClicking?: (val: boolean) => void;
}

export interface OptionItemProps {
  option: string;
  onPress: (option: string) => void;
  isSelected: boolean;
}
