export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function isFunction(value: unknown): value is Function {
  return typeof value === 'function'
}

export function hasChanged(newValue: unknown, oldValue: unknown): boolean {
  return !Object.is(newValue, oldValue)
}