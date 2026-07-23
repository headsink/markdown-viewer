// Tiny URL-safe id generator. Avoids extra dependency.
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function nanoid(size = 10): string {
  const arr = new Uint8Array(size);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < size; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  let id = "";
  for (let i = 0; i < size; i++) {
    id += ALPHABET[arr[i] % ALPHABET.length];
  }
  return id;
}
