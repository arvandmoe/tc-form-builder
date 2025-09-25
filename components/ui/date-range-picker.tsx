"use client"

import * as React from "react"
import { format, parse } from "date-fns"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type DateRangeValue = {
  from?: string
  to?: string
}

type DateRangePickerProps = {
  value?: DateRangeValue
  onChange?: (value: DateRangeValue) => void
  placeholder?: string
  className?: string
  allowOpenStart?: boolean
  allowOpenEnd?: boolean
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Pick a date range",
  className,
  allowOpenStart = false,
  allowOpenEnd = false,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)

  const selected = React.useMemo(() => {
    const fromDate = value?.from ? parse(value.from, "yyyy-MM-dd", new Date()) : undefined
    const toDate = value?.to ? parse(value.to, "yyyy-MM-dd", new Date()) : undefined
    return { from: fromDate, to: toDate }
  }, [value?.from, value?.to])

  const label = React.useMemo(() => {
    const from = value?.from
    const to = value?.to
    if (!from && !to) return placeholder
    if (from && to) return `${from} → ${to}`
    if (from && allowOpenEnd) return `${from} → …`
    if (to && allowOpenStart) return `… → ${to}`
    return placeholder
  }, [value?.from, value?.to, placeholder, allowOpenEnd, allowOpenStart])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("justify-start text-left font-normal w-[260px]", !value?.from && !value?.to && "text-muted-foreground", className)}>
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-auto min-w-[560px]" align="start">
        <Calendar
          mode="range"
          numberOfMonths={2}
          selected={selected}
          onSelect={(range) => {
            const from = range?.from ? format(range.from, "yyyy-MM-dd") : undefined
            const to = range?.to ? format(range.to, "yyyy-MM-dd") : undefined
            const next: DateRangeValue = {
              from: from ?? (allowOpenStart ? undefined : value?.from),
              to: to ?? (allowOpenEnd ? undefined : value?.to),
            }
            onChange?.(next)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}


