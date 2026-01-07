import { Brain, Clock, AlertTriangle, TrendingUp, Activity, FileText, BarChart3 } from 'lucide-react';
import { useState } from 'react';

export function IncidentAnalysis() {
  const [activeTab, setActiveTab] = useState<'metrics' | 'logs' | 'traces'>('metrics');

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">Incident Analysis</h1>
        <p className="text-gray-600">AI-powered root cause analysis for INC-1021</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Analysis Content */}
        <div className="col-span-2 space-y-6">
          {/* AI Summary */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div className="text-lg text-gray-900">AI Incident Summary</div>
            </div>
            <p className="text-gray-700 leading-relaxed">
              The checkout failure was caused by elevated latency in the payment service due to 
              database connection pool exhaustion, leading to cascading timeouts across the checkout flow.
            </p>
          </div>

          {/* Root Cause Timeline */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="text-lg text-gray-900 mb-4">Root Cause Timeline</div>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-sm text-red-700">
                    1
                  </div>
                  <div className="w-px h-full bg-gray-200 mt-2"></div>
                </div>
                <div className="flex-1 pb-6">
                  <div className="text-gray-900 mb-1">Database connections exhausted</div>
                  <div className="text-sm text-gray-500">
                    Connection pool reached maximum capacity (50/50 connections), causing new requests to wait
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-sm text-red-700">
                    2
                  </div>
                  <div className="w-px h-full bg-gray-200 mt-2"></div>
                </div>
                <div className="flex-1 pb-6">
                  <div className="text-gray-900 mb-1">Payment service retries increased</div>
                  <div className="text-sm text-gray-500">
                    Failed DB queries triggered automatic retries, further saturating the connection pool
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-sm text-red-700">
                    3
                  </div>
                  <div className="w-px h-full bg-gray-200 mt-2"></div>
                </div>
                <div className="flex-1 pb-6">
                  <div className="text-gray-900 mb-1">Order requests delayed</div>
                  <div className="text-sm text-gray-500">
                    Payment service latency increased to 5.2s, causing upstream order service timeouts
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-sm text-red-700">
                    4
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-gray-900 mb-1">Checkout requests timed out</div>
                  <div className="text-sm text-gray-500">
                    End-user checkout flow exceeded 10s timeout, resulting in 30% failure rate
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* When & Where */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="text-lg text-gray-900 mb-4">When & Where</div>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500 mb-1">Started at</div>
                  <div className="text-gray-900">10:12 AM (3 minutes before detection)</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Activity className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500 mb-1">Primary Service</div>
                  <div className="text-gray-900">payment-service</div>
                </div>
              </div>
              <div className="flex items-start gap-3 col-span-2">
                <TrendingUp className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500 mb-1">Affected Flow</div>
                  <div className="text-gray-900">Checkout → Order → Payment → Database</div>
                </div>
              </div>
            </div>
          </div>

          {/* Impact & Prediction */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="text-lg text-gray-900 mb-4">Impact & Prediction</div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <div className="text-gray-900">Checkout failure rate ~30%</div>
                  <div className="text-sm text-gray-500">Approximately 450 failed checkouts in the last 10 minutes</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <div className="text-gray-900">Risk of cascading failures</div>
                  <div className="text-sm text-gray-500">If unresolved, may impact order-service and checkout-service availability</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Actions */}
          <div className="bg-white rounded-lg border border-green-200 p-6 shadow-sm">
            <div className="text-lg text-gray-900 mb-4">Recommended Actions</div>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">
                  1
                </div>
                <div>
                  <div className="text-gray-900 mb-1">Increase database connection pool</div>
                  <div className="text-sm text-gray-600">
                    Scale pool from 50 to 100 connections to handle current load
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">
                  2
                </div>
                <div>
                  <div className="text-gray-900 mb-1">Apply exponential backoff to retries</div>
                  <div className="text-sm text-gray-600">
                    Reduce retry storm by implementing exponential backoff strategy
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">
                  3
                </div>
                <div>
                  <div className="text-gray-900 mb-1">Scale payment-service replicas</div>
                  <div className="text-sm text-gray-600">
                    Horizontal scaling to distribute load across more instances
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Telemetry Evidence Panel */}
        <div className="col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm sticky top-8">
            <div className="p-4 border-b border-gray-200">
              <div className="text-lg text-gray-900">Telemetry Evidence</div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('metrics')}
                className={`flex-1 px-4 py-3 text-sm transition-colors ${
                  activeTab === 'metrics'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Metrics</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`flex-1 px-4 py-3 text-sm transition-colors ${
                  activeTab === 'logs'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Logs</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('traces')}
                className={`flex-1 px-4 py-3 text-sm transition-colors ${
                  activeTab === 'traces'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Activity className="w-4 h-4" />
                  <span>Traces</span>
                </div>
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-4">
              {activeTab === 'metrics' && (
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-2">Database Connections</div>
                    <div className="bg-gray-50 p-3 rounded text-xs text-gray-900 space-y-1">
                      <div>10:12 AM - 45/50 (90%)</div>
                      <div>10:13 AM - 48/50 (96%)</div>
                      <div className="text-red-600">10:14 AM - 50/50 (100%)</div>
                      <div className="text-red-600">10:15 AM - 50/50 (100%)</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-2">Response Latency (P95)</div>
                    <div className="bg-gray-50 p-3 rounded text-xs text-gray-900 space-y-1">
                      <div>10:10 AM - 180ms</div>
                      <div>10:12 AM - 850ms</div>
                      <div className="text-red-600">10:14 AM - 3.2s</div>
                      <div className="text-red-600">10:15 AM - 5.2s</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-2">Error Rate</div>
                    <div className="bg-gray-50 p-3 rounded text-xs text-gray-900 space-y-1">
                      <div>10:10 AM - 0.2%</div>
                      <div>10:12 AM - 2.1%</div>
                      <div className="text-red-600">10:14 AM - 8.3%</div>
                      <div className="text-red-600">10:15 AM - 12.4%</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'logs' && (
                <div className="space-y-3">
                  <div className="bg-red-50 p-3 rounded border border-red-100">
                    <div className="text-xs text-gray-500 mb-1">10:14:23 AM</div>
                    <div className="text-xs text-red-700">
                      ERROR: Connection pool timeout after 5000ms
                    </div>
                  </div>
                  <div className="bg-red-50 p-3 rounded border border-red-100">
                    <div className="text-xs text-gray-500 mb-1">10:14:31 AM</div>
                    <div className="text-xs text-red-700">
                      WARN: Retry attempt 3/3 for query failed
                    </div>
                  </div>
                  <div className="bg-red-50 p-3 rounded border border-red-100">
                    <div className="text-xs text-gray-500 mb-1">10:15:02 AM</div>
                    <div className="text-xs text-red-700">
                      ERROR: Payment processing timeout
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-xs text-gray-500 mb-1">10:15:45 AM</div>
                    <div className="text-xs text-gray-600">
                      INFO: Circuit breaker opened for payment-db
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'traces' && (
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-xs text-gray-500 mb-2">Trace: checkout_flow_abc123</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-700">checkout-service</span>
                        <span className="text-gray-500">142ms</span>
                      </div>
                      <div className="flex justify-between pl-3">
                        <span className="text-gray-700">order-service</span>
                        <span className="text-gray-500">231ms</span>
                      </div>
                      <div className="flex justify-between pl-6">
                        <span className="text-red-700">payment-service</span>
                        <span className="text-red-600">5,234ms</span>
                      </div>
                      <div className="flex justify-between pl-9">
                        <span className="text-red-700">db.query</span>
                        <span className="text-red-600">5,012ms</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 text-center py-2">
                    Total duration: 5,607ms
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
