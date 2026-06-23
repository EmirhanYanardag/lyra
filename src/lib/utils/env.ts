export function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
  };
}

export function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY || null;
}

export function get0GStorageEnv() {
  const enabled = process.env.OG_STORAGE_ENABLED === "true";
  const configuredMode = process.env.OG_STORAGE_MODE;
  const rpcUrl = process.env.OG_STORAGE_RPC_URL;
  const indexerUrl = process.env.OG_STORAGE_INDEXER_URL;
  const privateKey = process.env.OG_STORAGE_PRIVATE_KEY;

  return {
    enabled,
    mode: configuredMode === "real" ? "real" : configuredMode === "mock" ? "mock" : null,
    rpcUrl,
    indexerUrl,
    privateKey,
    hasRequiredRealConfig: Boolean(enabled && rpcUrl && indexerUrl && privateKey),
  };
}
