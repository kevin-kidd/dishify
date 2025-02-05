"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
        exit={{ opacity: 0, y: -10 }}
        transition={{
          type: "spring",
          stiffness: 380,
          damping: 30,
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
