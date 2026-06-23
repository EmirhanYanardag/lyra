import { AppShell } from "@/components/layout/app-shell";
import { get0GDiagnostics } from "@/lib/0g/storage";
import { get0GStorageEnv } from "@/lib/utils/env";

type OgDebugPageProps = {
  searchParams: Promise<{
    uploadTest?: string;
  }>;
};

export default async function OgDebugPage({ searchParams }: OgDebugPageProps) {
  const resolvedSearchParams = await searchParams;
  const runUploadTest = resolvedSearchParams.uploadTest === "1";
  const env = get0GStorageEnv();
  const diagnostics = await get0GDiagnostics({ runUploadTest });

  return (
    <AppShell>
      <section className="glass-card rounded-2xl p-8">
        <p className="lyra-label text-sm">
          0G Debug
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-white">
          Real Storage Diagnostics
        </h1>
        <p className="mt-3 max-w-3xl text-slate-300">
          This page checks LYRA&apos;s server-side 0G Storage configuration
          without exposing secrets. The upload test performs a real paid
          network write when real mode is configured.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <DebugItem label="Current Mode" value={diagnostics.mode} />
          <DebugItem label="OG_STORAGE_ENABLED" value={String(env.enabled)} />
          <DebugItem label="OG_STORAGE_MODE" value={env.mode ?? "real"} />
          <DebugItem label="RPC URL exists" value={String(Boolean(env.rpcUrl))} />
          <DebugItem
            label="Indexer URL exists"
            value={String(Boolean(env.indexerUrl))}
          />
          <DebugItem
            label="Private key exists"
            value={String(Boolean(env.privateKey))}
          />
          <DebugItem
            label="SDK Status"
            value={diagnostics.sdkStatus.label}
            ok={diagnostics.sdkStatus.ok}
            error={diagnostics.sdkStatus.error}
          />
          <DebugItem
            label="RPC Connectivity"
            value={diagnostics.rpcConnectivity.label}
            ok={diagnostics.rpcConnectivity.ok}
            error={diagnostics.rpcConnectivity.error}
          />
          <DebugItem
            label="Indexer Connectivity"
            value={diagnostics.indexerConnectivity.label}
            ok={diagnostics.indexerConnectivity.ok}
            error={diagnostics.indexerConnectivity.error}
          />
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="lyra-label text-xs">
            Upload Test
          </p>
          {diagnostics.uploadTest ? (
            <div className="mt-3 space-y-2 text-sm">
              <p className="text-slate-100">
                Result: {diagnostics.uploadTest.ok ? "Success" : "Failed"}
              </p>
              <p className="text-slate-300">
                Mode: {diagnostics.uploadTest.mode}
              </p>
              <p className="break-all font-mono text-xs text-[var(--lyra-chip-text)]">
                Root Hash: {diagnostics.uploadTest.rootHash ?? "none"}
              </p>
              <p className="break-all font-mono text-xs text-slate-400">
                TX Hash: {diagnostics.uploadTest.txHash ?? "none"}
              </p>
              <p className="text-slate-400">
                Size: {diagnostics.uploadTest.sizeBytes} bytes
              </p>
              {diagnostics.uploadTest.error && (
                <p className="text-red-100">
                  Error: {diagnostics.uploadTest.error}
                </p>
              )}
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <p className="text-sm text-slate-300">
                Upload test not run. Add{" "}
                <span className="font-mono text-[var(--lyra-chip-text)]">?uploadTest=1</span>{" "}
                to perform a real 0G write.
              </p>
              <a
                href="/og-debug?uploadTest=1"
                className="inline-flex rounded-full border border-[var(--lyra-button-border)] bg-[var(--lyra-button-bg)] px-4 py-2 text-sm text-[var(--lyra-button-text)] transition hover:border-[var(--lyra-button-hover-border)] hover:bg-[var(--lyra-button-hover-bg)]"
              >
                Run upload test
              </a>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}

function DebugItem({
  label,
  value,
  ok,
  error,
}: {
  label: string;
  value: string;
  ok?: boolean;
  error?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="lyra-label text-xs">
          {label}
        </p>
        {typeof ok === "boolean" && (
          <span
            className={
              ok
                ? "lyra-chip rounded-full px-2 py-0.5 text-xs"
                : "rounded-full border border-red-300/20 bg-red-400/10 px-2 py-0.5 text-xs text-red-100"
            }
          >
            {ok ? "OK" : "Fail"}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-slate-100">{value}</p>
      {error && <p className="mt-2 text-xs text-red-100">{error}</p>}
    </div>
  );
}
