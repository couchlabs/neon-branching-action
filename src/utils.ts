export async function sleep(millisecs: number) {
  return new Promise((resolve) => setTimeout(resolve, millisecs));
}

export function notNull<T>(value: T) {
  if (value == null) {
    throw new Error("value should not be null");
  }
  return value;
}
