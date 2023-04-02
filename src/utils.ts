export async function sleep(millisecs: number) {
  return new Promise((resolve) => setTimeout(resolve, millisecs));
}
