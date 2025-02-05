import { AnimatePresence, MotiView } from "moti";
import { Card, cn, Div, Text } from "@dishify/ui/src";
import { useState } from "react";
import { Gauge } from "./gauge";
import { Check } from "@dishify/ui/src/icons/check";
import { XIcon } from "@dishify/ui/src/icons/X";

export const PasswordRequirements = ({
  errorCodes,
  passwordLength,
  isVisible,
}: {
  errorCodes: string | undefined;
  passwordLength: number | undefined;
  isVisible: boolean;
}) => {
  const [contentHeight, setContentHeight] = useState(0);
  let passwordProgressValue = passwordLength && passwordLength > 8 && !errorCodes ? 100 : 3.6;
  let parsedErrorCodes: number[] = [];

  if (errorCodes) {
    const parsedArray = JSON.parse(errorCodes) as number[];
    if (
      Array.isArray(parsedArray) &&
      parsedArray.length > 1 &&
      typeof parsedArray[0] === "number" &&
      parsedArray.slice(1).every((item) => typeof item === "number")
    ) {
      parsedErrorCodes = parsedArray;

      // Increment by 1/9th of 33 for each character until a length of 8 is met
      passwordProgressValue = Math.min(parsedArray[0], 9) * (33 / 9) + 33 / 9;
      const countZeros = parsedArray.slice(1).reduce((acc, val) => acc + (val === 0 ? 1 : 0), 0);
      passwordProgressValue += countZeros * 33;
    }
  }
  const requirements = {
    hasMinimumCharacters:
      parsedErrorCodes && typeof parsedErrorCodes[0] === "number" ? parsedErrorCodes[0] > 8 : false,
    hasSpecialCharacter:
      parsedErrorCodes && typeof parsedErrorCodes[1] === "number"
        ? parsedErrorCodes[1] === 0
        : false,
    hasCapitalLetter:
      parsedErrorCodes && typeof parsedErrorCodes[2] === "number"
        ? parsedErrorCodes[2] === 0
        : false,
  };

  return (
    <MotiView
      animate={{
        height: isVisible ? contentHeight : 0,
        marginTop: isVisible ? 0 : -16,
        opacity: isVisible ? 1 : 0,
      }}
      transition={{
        type: "timing",
        duration: 200,
      }}
      style={{ overflow: "hidden" }}
    >
      <AnimatePresence>
        {isVisible && (
          <MotiView
            from={{
              opacity: 0,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
            }}
            transition={{
              type: "spring",
              damping: 20,
              stiffness: 300,
            }}
          >
            <Card
              key="password-requirements"
              className="flex flex-row justify-between items-center py-4 pl-4 pr-6"
              onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}
            >
              <Div className="flex flex-col gap-2 xs:w-[70%] w-[85%]">
                <Div className="flex flex-row gap-2 items-center">
                  {requirements.hasMinimumCharacters || passwordProgressValue === 100 ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <XIcon className="w-4 h-4 text-red-600" />
                  )}
                  <Text className="text-sm">Minimum 8 characters</Text>
                </Div>
                <Div className="flex flex-row gap-2 items-center">
                  {requirements.hasSpecialCharacter || passwordProgressValue === 100 ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <XIcon className="w-4 h-4 text-red-600" />
                  )}
                  <Text className="text-sm">1 special character</Text>
                </Div>
                <Div className="flex flex-row gap-2 items-center">
                  {requirements.hasCapitalLetter || passwordProgressValue === 100 ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <XIcon className="w-4 h-4 text-red-600" />
                  )}
                  <Text className="text-sm">1 capital letter</Text>
                </Div>
              </Div>
              <Div className="flex flex-row items-center justify-center w-[15%] xs:w-[30%]">
                <Gauge size="medium" value={passwordProgressValue} changeColors={true} />
              </Div>
            </Card>
          </MotiView>
        )}
      </AnimatePresence>
    </MotiView>
  );
};
