import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cn } from "../../utils";
import { TextInput } from "../input";
import { useAutocomplete } from "../../utils/hooks/use-autocomplete";
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { OptionsList } from "./options-list";
import type { AutocompleteProps } from "./types";
import { View } from "react-native";

interface TextInputElement extends React.ReactElement<any> {
  type: typeof TextInput;
  props: {
    onFocus?: (...args: any[]) => void;
    children?: React.ReactNode;
  };
}

interface FormElement extends React.ReactElement<any> {
  props: {
    children?: React.ReactNode;
  };
}

export const Autocomplete = React.forwardRef<React.ComponentRef<typeof View>, AutocompleteProps>(
  ({ children, onSelect, getOptions, autocompleteOptions = [], className, ...props }, ref) => {
    const insets = useSafeAreaInsets();
    const bottomSheetRef = React.useRef<BottomSheet>(null);
    const snapPoints = React.useMemo(() => ["90%"], []);
    const [selectedIndex, setSelectedIndex] = React.useState(-1);

    const { isOpen, setIsOpen, inputValue, handleSelectOption } = useAutocomplete({
      onSelect,
      getOptions,
      autocompleteOptions,
      children,
    });

    const handleSheetChanges = React.useCallback(
      (index: number) => {
        if (index === -1) {
          setIsOpen(false);
        }
      },
      [setIsOpen],
    );

    const handleSelect = React.useCallback(
      (option: string) => {
        handleSelectOption(option);
        bottomSheetRef.current?.close();
      },
      [handleSelectOption],
    );

    const renderBackdrop = React.useCallback(
      (props: any) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />,
      [],
    );

    // Find the TextInput within the Form and clone it with focus handling
    const enhancedChildren = React.Children.map(children, (child) => {
      if (!React.isValidElement(child)) return child;

      // If this is a Form component, recursively search for and enhance the TextInput
      const enhanceInput = (element: React.ReactElement) => {
        if (!React.isValidElement(element)) return element;

        // Check if this is our TextInput component
        if (element.type === TextInput) {
          const inputElement = element as TextInputElement;
          return React.cloneElement(inputElement, {
            ...inputElement.props,
            onFocus: (...args: any[]) => {
              setIsOpen(true);
              bottomSheetRef.current?.expand();
              if (inputElement.props.onFocus) {
                inputElement.props.onFocus(...args);
              }
            },
          });
        }

        // Recursively handle children if they exist
        if (React.isValidElement(element)) {
          const formElement = element as FormElement;
          if (formElement.props.children) {
            const newChildren = React.Children.map(formElement.props.children, enhanceInput);
            return React.cloneElement(formElement, formElement.props, newChildren);
          }
        }

        return element;
      };

      return enhanceInput(child);
    });

    const shouldShowOptions =
      isOpen &&
      autocompleteOptions &&
      autocompleteOptions.length > 0 &&
      inputValue.length >= 3 &&
      inputValue.slice(0, 3) === autocompleteOptions[0].slice(0, 3);

    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View ref={ref} className={cn("flex-1", className)} {...props}>
          {enhancedChildren}
          <BottomSheet
            ref={bottomSheetRef}
            index={-1}
            snapPoints={snapPoints}
            onChange={handleSheetChanges}
            enablePanDownToClose
            backdropComponent={renderBackdrop}
            handleStyle={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 15,
              borderTopRightRadius: 15,
            }}
          >
            <BottomSheetView style={{ flex: 1, paddingBottom: insets.bottom }}>
              {shouldShowOptions && (
                <OptionsList
                  options={autocompleteOptions}
                  selectedIndex={selectedIndex}
                  onSelect={handleSelect}
                />
              )}
            </BottomSheetView>
          </BottomSheet>
        </View>
      </GestureHandlerRootView>
    );
  },
);

Autocomplete.displayName = "Autocomplete";
