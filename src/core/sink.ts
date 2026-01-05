/**
 * Performance metrics for a JQL execution.
 */
export interface JQLStats {
  matchedCount: number
  processedBytes: number
  durationMs: number
  throughputMbps: number
  skipRatio: number
}

/**
 * Interface for JQL output delivery.
 * Decouples the engine from specific emission formats or targets.
 */
export interface OutputSink {
  /**
   * Called when a new projected object/value is ready.
   */
  onMatch?(data: any): void

  /**
   * Called when raw source bytes for a match are requested (emitRaw mode).
   */
  onRawMatch?(chunk: Uint8Array): void

  /**
   * Called periodically or at completion with performance metrics.
   */
  onStats?(stats: JQLStats): void
}
