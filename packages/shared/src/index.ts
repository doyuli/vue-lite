export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function isFunction(value: unknown): value is Function {
  return typeof value === 'function'
}

export function isArray(value: unknown): value is Array<unknown> {
  return Array.isArray(value)
}

export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export function isOn(value: string): boolean {
  return /^on[A-Z]/.test(value)
}

export function hasChanged(newValue: unknown, oldValue: unknown): boolean {
  return !Object.is(newValue, oldValue)
}
