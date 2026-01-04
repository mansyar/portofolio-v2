export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = any
// TODO: Generate real types using Supabase CLI
// npx supabase gen types typescript --project-id aznbosrcxfpettmecwkn > src/lib/supabase/types.ts
