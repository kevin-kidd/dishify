import { ReactNode, createContext, useContext, useRef, useState } from "react";
import { View, Text } from "react-native";
import { cn } from "../utils";
import { isWeb } from "@tamagui/constants";

const TooltipGroupContext = createContext<{
  activeTooltip: string | undefined;
  setActiveTooltip: (id: string | undefined) => void;
  switchDelay?: number;
  clearTooltipTimeout: () => void;
  isInGroup: boolean;
}>({
  activeTooltip: undefined,
  setActiveTooltip: (id: string | undefined) => {},
  switchDelay: 100,
  clearTooltipTimeout: () => {},
  isInGroup: false,
});
const useTooltipGroup = () => useContext(TooltipGroupContext);

const TooltipContext = createContext({ show: false, setShow: (show: boolean) => {} });
const useTooltip = () => useContext(TooltipContext);

export const TooltipGroup = ({ children, switchDelay = 100 }) => {
  const [activeTooltip, setActiveTooltip] = useState<string | undefined>();
  const timeoutId = useRef<number | null>(null); // Use number for browser environments

  // Clear any existing timeout when switching tooltips within the group
  const handleSwitchTooltip = (id: string) => {
    if (timeoutId.current !== null) {
      window.clearTimeout(timeoutId.current); // Use window.clearTimeout for browser environments
      timeoutId.current = null;
    }
    timeoutId.current = window.setTimeout(() => {
      setActiveTooltip(id);
    }, switchDelay);
  };

  const clearTooltipTimeout = () => {
    // Check if timeoutId.current is not null before calling clearTimeout
    if (timeoutId.current !== null) {
      clearTimeout(timeoutId.current);
      timeoutId.current = null;
    }
  };

  return (
    <TooltipGroupContext.Provider
      value={{
        activeTooltip,
        setActiveTooltip: handleSwitchTooltip,
        clearTooltipTimeout,
        switchDelay,
        isInGroup: true,
      }}
    >
      {children}
    </TooltipGroupContext.Provider>
  );
};

export const Tooltip = ({ children }) => {
  const [show, setShow] = useState(false);

  return (
    <TooltipContext.Provider value={{ show, setShow }}>
      <View className="relative z-50">{children}</View>
    </TooltipContext.Provider>
  );
};

export const TooltipTrigger = ({
  children,
  delayDuration = 500,
}: { children: ReactNode; delayDuration?: number }) => {
  const { activeTooltip, setActiveTooltip, switchDelay, clearTooltipTimeout, isInGroup } =
    useTooltipGroup();
  const { setShow } = useTooltip();
  const timeoutId = useRef<number | null>(null);

  // Generate a unique ID for each TooltipTrigger
  const id = useRef(Math.random().toString(36).substring(2, 9)).current;

  const handleMouseEnter = () => {
    clearTooltipTimeout(); // Clear any existing tooltip timeout

    const delay = isInGroup && activeTooltip ? switchDelay : delayDuration;

    if (timeoutId.current !== null) {
      clearTimeout(timeoutId.current);
    }
    timeoutId.current = window.setTimeout(() => {
      setShow(true);
      if (isInGroup && id !== undefined) {
        setActiveTooltip(id);
      }
    }, delay);
  };

  const handleMouseLeave = () => {
    clearTooltipTimeout(); // Clear the timeout again on mouse leave

    if (timeoutId.current !== null) {
      clearTimeout(timeoutId.current);
      timeoutId.current = null;
    }
    setShow(false);
    if (isInGroup) {
      setActiveTooltip(undefined);
    }
  };
  if (!isWeb) return children;
  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="z-10">
      {children}
    </div>
  );
};

export const TooltipContent = ({
  children,
  className,
  textClassName,
  position = "bottom",
}: {
  children: ReactNode;
  className?: string;
  textClassName?: string;
  position?: "bottom" | "top" | "left" | "right";
}) => {
  const { show } = useTooltip();
  if (!isWeb) return null;
  const positionClasses = {
    bottom: `top-full -translate-x-1/2 left-1/2 ${
      show ? "translate-y-2" : "translate-y-0 scale-y-95"
    }`,
    top: `bottom-full -translate-x-1/2 left-1/2 ${
      show ? "-translate-y-2" : "translate-y-0 scale-y-95"
    }`,
    left: `left-full -translate-y-1/2 top-1/2 ${
      show ? "-translate-x-2" : "translate-x-0 scale-x-95"
    }`,
    right: `left-full -translate-y-1/2 top-1/2 ${
      show ? "translate-x-2" : "translate-x-0 scale-x-95"
    }`,
  };
  return (
    <div
      className={cn(
        "w-max absolute z-20 overflow-hidden rounded-md text-popover-foreground text-sm border border-border bg-popover px-3 py-1.5 shadow-md transition ease-in",
        positionClasses[position],
        textClassName,
        className,
        show ? "md:visible invisible opacity-100 scale-100" : "opacity-0 invisible"
      )}
    >
      {children}
    </div>
  );
};
