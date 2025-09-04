import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

type Status = "pending" | "success";
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

  return (
    <div className="flex items-center justify-center">
      <AnimatePresence mode="wait">
        {status === "pending" ? (
          <motion.div
            key="pending"
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
        ) : (
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
              initial={{ strokeDasharray: "0 100" }}
              animate={{ strokeDasharray: "100 0" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
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
        )}
      </AnimatePresence>
    </div>
  );
}
