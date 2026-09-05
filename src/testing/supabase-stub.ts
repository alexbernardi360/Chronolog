/**
 * Builds a data service around a stub client, skipping the real
 * `createClient()` field initializer. The services take no constructor
 * arguments and only ever touch `this.supabase`, so a bare prototype instance
 * is enough — and it keeps specs from constructing a live Supabase client or
 * depending on `environment.ts` being filled in.
 */
export function serviceWithClient<T extends object>(
  service: { prototype: T },
  supabase: unknown,
): T {
  return Object.assign(Object.create(service.prototype), { supabase });
}

/**
 * Minimal stand-in for a Supabase query builder. The services only ever chain
 * filter methods and then await the result, so the stub records the chain and
 * resolves to whatever `result` is handed to it.
 */
const CHAIN_METHODS = [
  'select',
  'order',
  'range',
  'eq',
  'gte',
  'lt',
  'insert',
  'update',
  'delete',
] as const;

type ChainMethod = (typeof CHAIN_METHODS)[number];

export interface ChainCall {
  method: ChainMethod;
  args: unknown[];
}

export type QueryStub<T> = PromiseLike<T> &
  Record<ChainMethod, (...args: unknown[]) => QueryStub<T>> & {
    calls: ChainCall[];
    /** Arguments the service passed to `method`, or undefined if never called. */
    args(method: ChainMethod): unknown[] | undefined;
  };

export function queryStub<T>(result: T): QueryStub<T> {
  const calls: ChainCall[] = [];

  const stub = {
    calls,
    args: (method: ChainMethod) => calls.find((c) => c.method === method)?.args,
    then: <R1, R2>(
      onOk?: ((value: T) => R1 | PromiseLike<R1>) | null,
      onErr?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
    ) => Promise.resolve(result).then(onOk, onErr),
  } as unknown as QueryStub<T>;

  for (const method of CHAIN_METHODS) {
    stub[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return stub;
    };
  }

  return stub;
}
