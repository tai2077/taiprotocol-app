import { Buffer } from 'buffer';

if (typeof globalThis.Buffer === 'undefined') {
  (globalThis as typeof globalThis & { Buffer: typeof Buffer }).Buffer = Buffer;
}
