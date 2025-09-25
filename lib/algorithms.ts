import algorithmsJson from "../data/data.json"
import { z } from "zod"

// Types describing the algorithms JSON structure
export type AlgorithmOutput = {
  key: string
  label: string
  type: string
  entity?: string
  description?: string
}

export type NumberInput = {
  key: string
  label: string
  description?: string
  type: "number"
  min?: number
  max?: number
  step?: number
  default?: number
  required?: boolean
}

export type TextInput = {
  key: string
  label: string
  description?: string
  type: "text"
  placeholder?: string
  default?: string
  required?: boolean
}

export type DateRangeConfig = {
  format: string // e.g. "YYYY-MM-DD"
  allowOpenStart: boolean
  allowOpenEnd: boolean
}

export type DateRangeInput = {
  key: string
  label: string
  description?: string
  type: "date_range"
  required?: boolean
  date_range: DateRangeConfig
}

export type AlgorithmInput = NumberInput | TextInput | DateRangeInput

export type AlgorithmDefinition = {
  key: string
  name: string
  category: string
  description?: string
  version: string
  ui?: Record<string, unknown>
  inputs: AlgorithmInput[]
  outputs: AlgorithmOutput[]
}

export type AlgorithmsLibrary = AlgorithmDefinition[]

// Accessors
export function getAlgorithms(): AlgorithmsLibrary {
  return algorithmsJson as AlgorithmsLibrary
}

export function getAlgorithmByKey(key: string): AlgorithmDefinition | undefined {
  return getAlgorithms().find((a) => a.key === key)
}

export function getAlgorithmOptions() {
  return getAlgorithms().map((a) => ({ value: a.key, label: a.name }))
}

// Helpers
export function buildZodSchema(algorithm: AlgorithmDefinition) {
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const input of algorithm.inputs) {
    if (input.type === "number") {
      const cfg = input as NumberInput
      let s = z.number()
      if (typeof cfg.min === "number") s = s.min(cfg.min, { message: `${cfg.label} must be ≥ ${cfg.min}` })
      if (typeof cfg.max === "number") s = s.max(cfg.max, { message: `${cfg.label} must be ≤ ${cfg.max}` })
      if (typeof cfg.step === "number" && cfg.step > 0) {
        const start = typeof cfg.min === "number" ? cfg.min : 0
        const step = cfg.step
        s = s.refine(
          (v) => {
            if (typeof v !== "number") return false
            const delta = v - start
            const steps = Math.round(delta / step)
            return Math.abs(delta - steps * step) < 1e-8
          },
          { message: `${cfg.label} must align with step ${step}` }
        )
      }
      shape[cfg.key] = cfg.required === false ? s.optional() : s
    } else if (input.type === "text") {
      const cfg = input as TextInput
      const s = cfg.required === false
        ? z.string().optional()
        : z.string().trim().min(1, { message: `${cfg.label} is required` })
      shape[cfg.key] = s
    } else if (input.type === "date_range") {
      const cfg = input as DateRangeInput
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      const fromBase = z
        .string()
        .regex(dateRegex, `${cfg.label} start must be in YYYY-MM-DD`)
      const toBase = z
        .string()
        .regex(dateRegex, `${cfg.label} end must be in YYYY-MM-DD`)

      const from = cfg.date_range.allowOpenStart ? fromBase.optional() : fromBase
      const to = cfg.date_range.allowOpenEnd ? toBase.optional() : toBase

      const isRequired = (input as DateRangeInput).required !== false
      const s = z.object({ from, to }).refine(
        (val) => {
          const hasFrom = !!val?.from
          const hasTo = !!val?.to
          if (isRequired && !hasFrom && !hasTo) return false
          if (hasFrom && hasTo) {
            // Basic lexical compare works for YYYY-MM-DD format
            return val.from! <= val.to!
          }
          return true
        },
        { message: `${cfg.label} start must be before end` }
      )

      shape[cfg.key] = s
    }
  }

  return z.object(shape)
}

export type InferParams = z.infer<ReturnType<typeof buildZodSchema>>

export function createDefaultValues(algorithm: AlgorithmDefinition): Record<string, unknown> {
  const defaults: Record<string, unknown> = {}
  for (const input of algorithm.inputs) {
    if (input.type === "number") {
      const cfg = input as NumberInput
      if (typeof cfg.default === "number") {
        defaults[input.key] = cfg.default
      } else if (typeof cfg.min === "number") {
        defaults[input.key] = cfg.min
      } else {
        defaults[input.key] = 0
      }
    } else if (input.type === "text") {
      const cfg = input as TextInput
      defaults[input.key] = cfg.default ?? ""
    } else if (input.type === "date_range") {
      defaults[input.key] = { from: "", to: "" }
    }
  }
  return defaults
}


