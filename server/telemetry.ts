import admin from 'firebase-admin';

interface ProviderMetrics {
  requests: number;
  tokens: number;
  latencySum: number;
  errors: number;
}

class TelemetryService {
  private metrics: Record<string, ProviderMetrics> = {};
  private flushInterval: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.resetMetrics();
  }

  private resetMetrics() {
    const providers = [
      'gemini_direct', 
      'gemini_openrouter', 
      'groq', 
      'mistral_direct', 
      'mistral_openrouter', 
      'cohere', 
      'huggingface'
    ];
    providers.forEach(p => {
      this.metrics[p] = { requests: 0, tokens: 0, latencySum: 0, errors: 0 };
    });
  }

  async initialize() {
    if (this.isInitialized) return;
    try {
      const doc = await admin.firestore().collection('system_stats').doc('ai_telemetry').get();
      if (doc.exists) {
        const data = doc.data();
        if (data && data.metrics) {
          // Merge with initial zeroes to ensure all providers exist
          this.metrics = { ...this.metrics, ...data.metrics };
          console.log('[Telemetry] Initialized from Firestore');
        }
      }
      this.isInitialized = true;
      this.startFlushing();
    } catch (e) {
      console.error('[Telemetry] Initialization failed:', e);
      // Still start flushing even if init fails
      this.startFlushing();
    }
  }

  record(provider: string, tokens: number, latencyMs: number, isError: boolean = false) {
    if (!this.metrics[provider]) {
      this.metrics[provider] = { requests: 0, tokens: 0, latencySum: 0, errors: 0 };
    }
    this.metrics[provider].requests++;
    this.metrics[provider].tokens += tokens;
    this.metrics[provider].latencySum += latencyMs;
    if (isError) this.metrics[provider].errors++;
  }

  getMetrics() {
    const result: any = {};
    for (const [provider, data] of Object.entries(this.metrics)) {
      const avgLatency = data.requests > 0 ? (data.latencySum / data.requests / 1000).toFixed(1) + 's' : '0s';
      const uptime = data.requests > 0 ? ((1 - data.errors / data.requests) * 100).toFixed(1) + '%' : '100%';
      result[provider] = {
        requests: data.requests,
        tokens: this.formatTokens(data.tokens),
        latency: avgLatency,
        uptime: uptime
      };
    }
    return result;
  }

  private formatTokens(n: number): string {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  }

  private startFlushing() {
    if (this.flushInterval) clearInterval(this.flushInterval);
    this.flushInterval = setInterval(async () => {
      await this.flushToFirestore();
    }, 5 * 60 * 1000); // Flush every 5 minutes
  }

  private async flushToFirestore() {
    try {
      await admin.firestore().collection('system_stats').doc('ai_telemetry').set({
        metrics: this.metrics,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      console.log('[Telemetry] Flushed metrics to Firestore');
    } catch (e) {
      console.error('[Telemetry] Failed to flush metrics:', e);
    }
  }
}

export const telemetry = new TelemetryService();
