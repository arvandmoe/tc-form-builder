"use client"

import * as React from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { getAlgorithmOptions, getAlgorithmByKey, buildZodSchema, createDefaultValues, type AlgorithmDefinition } from "@/lib/algorithms"
import { Combobox } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Label } from "@/components/ui/label"

function AlgorithmDetails({ algorithm }: { algorithm: AlgorithmDefinition }) {
  return (
    <div className="space-y-1">
      <div className="text-lg font-semibold">{algorithm.name}</div>
      {algorithm.description ? (
        <p className="text-sm text-muted-foreground">{algorithm.description}</p>
      ) : null}
      <div className="text-xs text-muted-foreground">v{algorithm.version} • {algorithm.category}</div>
    </div>
  )
}

export default function Home() {
  const algoOptions = React.useMemo(() => getAlgorithmOptions(), [])
  const [selectedAlgoKey, setSelectedAlgoKey] = React.useState<string>(algoOptions[0]?.value ?? "")
  const selectedAlgo = React.useMemo(() => getAlgorithmByKey(selectedAlgoKey), [selectedAlgoKey])

  const schema = React.useMemo(() => (selectedAlgo ? buildZodSchema(selectedAlgo) : z.object({})), [selectedAlgoKey])
  const defaultValues = React.useMemo(() => (selectedAlgo ? createDefaultValues(selectedAlgo) : {}), [selectedAlgoKey])

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any,
    mode: "onChange",
    reValidateMode: "onChange",
  })

  React.useEffect(() => {
    // Reset form when algorithm changes
    form.reset(defaultValues as any, { keepDefaultValues: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAlgoKey])

  React.useEffect(() => {
    // Ensure initial validation state is populated
    form.trigger()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAlgoKey])

  const watchedValues = form.watch()
  const zodCheck = React.useMemo(() => schema.safeParse(watchedValues), [schema, watchedValues])
  const zodFieldErrors = React.useMemo(() => {
    if (zodCheck.success) return {} as Record<string, string[]>
    return zodCheck.error.flatten().fieldErrors as Record<string, string[]>
  }, [zodCheck])

  return (
    <div className="p-6"> 
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Algorithm</Label>
            <Combobox
              items={algoOptions}
              placeholder="Select algorithm..."
              searchPlaceholder="Search algorithms..."
              value={selectedAlgoKey}
              onChange={(v) => setSelectedAlgoKey(v)}
            />
          </div>

          {selectedAlgo ? <AlgorithmDetails algorithm={selectedAlgo} /> : null}

          {selectedAlgo ? (
            <Form {...form}>
              <form className="space-y-4">
                {selectedAlgo.inputs.map((input) => {
                  if (input.type === "number") {
                    const cfg = input as any
                    return (
                      <FormField
                        key={cfg.key}
                        control={form.control}
                        name={cfg.key as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{cfg.label}</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                <Slider
                                  min={cfg.min ?? 0}
                                  max={cfg.max ?? Math.max((cfg.min ?? 0) + 10, 10)}
                                  value={[Number(field.value ?? 0)]}
                                  onValueChange={(vals) => { field.onChange(vals[0]); form.trigger(cfg.key as any) }}
                                />
                                <Input type="number" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))} onBlur={() => form.trigger(cfg.key as any)} />
                              </div>
                            </FormControl>
                            {cfg.description ? <FormDescription>{cfg.description}</FormDescription> : null}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )
                  }

                  if (input.type === "text") {
                    const cfg = input as any
                    return (
                      <FormField
                        key={cfg.key}
                        control={form.control}
                        name={cfg.key as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{cfg.label}</FormLabel>
                            <FormControl>
                              {cfg.placeholder && (cfg.placeholder.length > 30) ? (
                                <Textarea placeholder={cfg.placeholder} value={field.value ?? ""} onChange={(e) => { field.onChange(e); form.trigger(cfg.key as any) }} />
                              ) : (
                                <Input placeholder={cfg.placeholder} value={field.value ?? ""} onChange={(e) => { field.onChange(e); form.trigger(cfg.key as any) }} />
                              )}
                            </FormControl>
                            {cfg.description ? <FormDescription>{cfg.description}</FormDescription> : null}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )
                  }

                  if (input.type === "date_range") {
                    const cfg = input as any
                    return (
                      <FormField
                        key={cfg.key}
                        control={form.control}
                        name={cfg.key as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{cfg.label}</FormLabel>
                            <FormControl>
                              <DateRangePicker
                                value={field.value}
                                onChange={(v) => { field.onChange(v); form.trigger(cfg.key as any) }}
                                allowOpenStart={cfg.date_range?.allowOpenStart}
                                allowOpenEnd={cfg.date_range?.allowOpenEnd}
                              />
                            </FormControl>
                            {cfg.description ? <FormDescription>{cfg.description}</FormDescription> : null}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )
                  }

                  return null
                })}
              </form>
            </Form>
          ) : null}
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-lg font-semibold">Payload Preview</div>
            <p className="text-sm text-muted-foreground">This is what you could send to the backend.</p>
          </div>
          <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto whitespace-pre-wrap">
{JSON.stringify({ algorithm: selectedAlgoKey, params: form.watch() }, null, 2)}
          </pre>

          <div className="space-y-2">
            <div className="text-lg font-semibold">Validation Summary</div>
            <ul className="text-sm space-y-1">
              {selectedAlgo?.inputs.map((input) => {
                const err = (form.formState.errors as any)?.[input.key]
                const zodErrs = (zodFieldErrors as any)?.[input.key]
                const message = err?.message ?? (Array.isArray(zodErrs) ? zodErrs[0] : undefined)
                const passed = !message
                return (
                  <li key={input.key} className={passed ? "text-green-600" : "text-red-600"}>
                    {passed ? "✓" : "✗"} {input.label} {passed ? "passed" : String(message ?? "failed")}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
