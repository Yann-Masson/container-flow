import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

type Status = "pending" | "running" | "success" | "error";
type Size = "sm" | "md" | "lg" | number;

export function StatusIndicator({
  status,
  size = "md"
}: {
  status: Status;
  size?: Size;
}) {
  const getSize = (s: Size) => {
    if (typeof s === "number") return s;
    const sizes = { sm: 16, md: 20, lg: 24 };
    return sizes[s];
  };
  const pixelSize = getSize(size);
  const pendingSize = pixelSize * 0.5;

  return (
    <div className="flex items-center justify-center">
      <AnimatePresence mode="wait">
        {status === "pending" ? (
          <motion.div
            key="pending"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <motion.div
              style={{
                width: pendingSize,
                height: pendingSize,
                backgroundColor: "#d1d5db",
                borderRadius: "50%",
              }}
              className={cn("bg-accent animate-pulse rounded-md")}
              animate={{
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        ) : status === "running" ? (
          <motion.div
            key="running"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <Loader2
              className="animate-spin text-gray-400"
              style={{ width: pixelSize, height: pixelSize }}
            />
          </motion.div>
        ) : status === "success" ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <motion.svg
              width={pixelSize}
              height={pixelSize}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-green-500"
            >
              <motion.path
                d="M21.801 10A10 10 0 1 1 17 3.335"
                strokeDasharray="0 100"
                animate={{ strokeDasharray: "100 0" }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
              <motion.path
                d="m9 11 3 3L22 4"
                strokeDasharray="0 100"
                animate={{ strokeDasharray: "100 0" }}
                transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
              />
            </motion.svg>
          </motion.div>
        ) : (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <motion.svg
              width={pixelSize}
              height={pixelSize}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-500"
            >
              <circle cx="12" cy="12" r="10" />
              <motion.path
                d="m9 9 6 6m0-6-6 6"
                strokeDasharray="0 100"
                initial={{ strokeDasharray: "0 100", opacity: 0, pathLength: 0 }}
                animate={{ strokeDasharray: "100 0", opacity: 1, pathLength: 1 }}
                transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
              />
            </motion.svg>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
