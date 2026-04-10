"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDownIcon } from "lucide-react"

// ─── Native Select ───────────────────────────────────────────────────────────
// Uses context to share options from SelectContent into SelectTrigger's
// native <select> element.

type SelectCtx = {
  value: string
  onChange: (v: string) => void
  options: React.ReactNode
  setOpts: (o: React.ReactNode) => void
}

const Ctx = React.createContext<SelectCtx | null>(null)
const useCtx = () => {
  const c = React.useContext(Ctx)
  if (!c) throw new Error("Select components must be inside Select")
  return c
}

function Select({
  value,
  onValueChange,
  children,
  defaultValue,
}: {
  value?: string
  onValueChange?: (v: string) => void
  children: React.ReactNode
  defaultValue?: string
}) {
  const [int, setInt] = React.useState(value ?? defaultValue ?? "")
  const [opts, setOpts] = React.useState<React.ReactNode>(null)
  const val = value ?? int
  const onChange = React.useCallback(
    (v: string) => { if (value === undefined) setInt(v); onValueChange?.(v) },
    [value, onValueChange],
  )
  const setOptsCb = React.useCallback((o: React.ReactNode) => setOpts(o), [])

  return <Ctx.Provider value={{ value: val, onChange, options: opts, setOpts: setOptsCb }}>{children}</Ctx.Provider>
}

function SelectTrigger({ className, children, ...props }: React.ComponentProps<"select">) {
  const { value, onChange, options } = useCtx()
  return (
    <div className={cn("relative w-full", className)}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={cn(
          "block w-full appearance-none rounded-lg border dark:border-zinc-700 border-zinc-300/60 dark:bg-zinc-900/60 bg-zinc-50 px-2.5 pr-8 text-[13px] dark:text-zinc-200 text-zinc-800 transition-colors outline-none dark:hover:bg-zinc-800/60 hover:bg-zinc-100 hover:border-zinc-600/60 focus-visible:border-zinc-600 focus-visible:ring-2 focus-visible:ring-zinc-600/20 disabled:cursor-not-allowed disabled:opacity-50 h-8",
        )}
        {...props}
      >
        {children}
        {options}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
    </div>
  )
}

function SelectValue({ placeholder, ...props }: React.ComponentProps<"option"> & { placeholder?: string }) {
  return <option value="" disabled hidden {...props}>{placeholder}</option>
}

function SelectContent({ children }: { children: React.ReactNode }) {
  const { setOpts } = useCtx()
  React.useEffect(() => { setOpts(children); return () => setOpts(null) }, [children, setOpts])
  return null
}

function SelectGroup({ className, children, ...props }: React.ComponentProps<"optgroup">) {
  return <optgroup className={className} {...props}>{children}</optgroup>
}

function SelectItem({ className, children, value, ...props }: React.ComponentProps<"option">) {
  return <option value={value} className={className} {...props}>{children}</option>
}

function SelectLabel({ className, children, ...props }: React.ComponentProps<"option">) {
  return <option disabled className={cn("text-xs text-muted-foreground", className)} {...props}>{children}</option>
}

function SelectSeparator({ className, ...props }: React.ComponentProps<"hr">) {
  return <hr className={cn("my-1 h-px bg-border", className)} {...props} />
}

function SelectScrollUpButton({ ...p }: React.ComponentProps<"div">) { return null }
function SelectScrollDownButton({ ...p }: React.ComponentProps<"div">) { return null }

export {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel,
  SelectScrollDownButton, SelectScrollUpButton, SelectSeparator,
  SelectTrigger, SelectValue,
}
