// Define the type of the environment variables.
declare interface Env {
  readonly NODE_ENV: string;
  readonly NG_APP_SUPABASE_URL: string;
  readonly NG_APP_SUPABASE_KEY: string;
}

declare interface ImportMeta {
  readonly env: Env;
}
