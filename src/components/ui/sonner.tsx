import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group select-none"
      toastOptions={{
        ...props.toastOptions,
        classNames: {
          ...props.toastOptions?.classNames,
          // Add a subtle dark glass background; keep existing user classes if any
          toast: [
            props.toastOptions?.classNames?.toast,
            "backdrop-blur-md bg-gradient-to-br from-black/65 via-neutral-900/55 to-neutral-800/45 border border-white/10 shadow-lg"
          ].filter(Boolean).join(" ")
        }
      }}
      style={
        {
          "--normal-bg": "transparent", // let our gradient show fully
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
