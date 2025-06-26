export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function hasChanged(newValue: unknown, oldValue: unknown): boolean {
  return !Object.is(newValue, oldValue)
}