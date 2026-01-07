import { AlertCircle, Clock, TrendingUp, RefreshCw, ArrowRight } from 'lucide-react';

interface IncidentsProps {
  onNavigate: (page: 'analysis') => void;
}

export function Incidents({ onNavigate }: IncidentsProps) {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">Incidents</h1>
        <p className="text-gray-600">Active and historical incidents detected by AlertRAG</p>
      </div>

      {/* Active Incident Card */}
      <div className="bg-white rounded-lg border border-red-200 shadow-sm overflow-hidden mb-6">
        <div className="bg-red-50 px-6 py-3 border-b border-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-700">Active Incident</span>
          </div>
        </div>

        <div className="p-6">
          {/* Incident Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="text-xl text-gray-900 mb-2">Payment Service Degradation</div>
              <div className="text-gray-600">Elevated latency causing checkout failures</div>
            </div>
            <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
              High Severity
            </div>
          </div>

          {/* Incident Details Grid */}
          <div className="grid grid-cols-4 gap-6 mb-6 pb-6 border-b border-gray-200">
            <div>
              <div className="text-sm text-gray-500 mb-1">Incident ID</div>
              <div className="text-gray-900">INC-1021</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Affected Service</div>
              <div className="text-gray-900">payment-service</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Endpoint</div>
              <div className="text-gray-900">/payment/charge</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Detected Time</div>
              <div className="text-gray-900">10:15 AM</div>
            </div>
          </div>

          {/* Triggered Signals */}
          <div className="mb-6">
            <div className="text-sm text-gray-500 mb-3">Triggered Signals</div>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                <TrendingUp className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                  <div className="text-sm text-gray-900">Latency spike</div>
                  <div className="text-xs text-gray-500">5.2s avg (baseline: 180ms)</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                  <div className="text-sm text-gray-900">Error rate above threshold</div>
                  <div className="text-xs text-gray-500">12.4% (threshold: 1%)</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                <RefreshCw className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                  <div className="text-sm text-gray-900">Retry surge</div>
                  <div className="text-xs text-gray-500">3.2x normal volume</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => onNavigate('analysis')}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Analyze with AlertRAG
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="text-sm text-gray-500 mb-4">Recent Incidents (Resolved)</div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-gray-400" />
              <div>
                <div className="text-sm text-gray-900">INC-1020 - Database Connection Pool Exhaustion</div>
                <div className="text-xs text-gray-500">Dec 22, 2024 - Resolved in 18 minutes</div>
              </div>
            </div>
            <span className="text-xs text-green-600">Resolved</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-gray-400" />
              <div>
                <div className="text-sm text-gray-900">INC-1019 - API Gateway Rate Limiting</div>
                <div className="text-xs text-gray-500">Dec 21, 2024 - Resolved in 12 minutes</div>
              </div>
            </div>
            <span className="text-xs text-green-600">Resolved</span>
          </div>
        </div>
      </div>
    </div>
  );
}
