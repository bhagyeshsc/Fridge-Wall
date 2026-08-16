/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  /** 'local' builds against the Android host. Anything else means Supabase. */
  readonly VITE_BACKEND?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
