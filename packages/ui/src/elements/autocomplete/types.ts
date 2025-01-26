import type { ReactElement } from "react";

export interface AutocompleteProps {
  children: ReactElement;
  onSelect: (option: string) => void;
  getOptions: () => Promise<void>;
  autocompleteOptions?: string[];
  className?: string;
}

export interface OptionsListProps {
  options: string[];
  selectedIndex: number;
  onSelect: (option: string) => void;
}

export interface OptionItemProps {
  option: string;
  onPress: (option: string) => void;
  isSelected: boolean;
}
