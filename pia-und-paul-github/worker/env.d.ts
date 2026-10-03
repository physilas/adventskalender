// Minimal Cloudflare D1 types so this standalone worker can be type-checked
// without installing any packages. Wrangler supplies the real runtime binding.
interface D1Database {
  prepare(query: string): D1PreparedStatement;
}
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = unknown>(): Promise<{ results: T[] }>;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<unknown>;
}
