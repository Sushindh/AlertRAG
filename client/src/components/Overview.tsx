import { Server, AlertCircle, Target } from 'lucide-react';

interface OverviewProps {
  onNavigate: (page: 'incidents') => void;
}

export function Overview({ onNavigate }: OverviewProps) {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-gray-900 mb-8">System Overview</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Server className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-sm text-gray-500">Services Monitored</div>
          </div>
          <div className="text-3xl text-gray-900 ml-13">1</div>
        </div>

        <div className="bg-white rounded-lg border border-red-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-sm text-gray-500">Active Incidents</div>
          </div>
          <div className="text-3xl text-red-600 ml-13">1</div>
        </div>

        <div className="bg-white rounded-lg border border-red-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-sm text-gray-500">SLO Status</div>
          </div>
          <div className="text-xl text-red-600 ml-13">Breached</div>
        </div>
      </div>

      {/* Status Banner */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <div>
              <div className="text-xl text-gray-900 mb-1">Active Incident Detected</div>
              <div className="text-gray-600">Payment service experiencing elevated latency and errors</div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('incidents')}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
          >
            View Active Incident
          </button>
        </div>
      </div>

      {/* Additional System Info */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="text-sm text-gray-500 mb-4">System Health</div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Overall Availability</span>
              <span className="text-yellow-600">98.7%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Avg Response Time</span>
              <span className="text-red-600">4.2s</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Error Budget Remaining</span>
              <span className="text-red-600">15%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="text-sm text-gray-500 mb-4">Recent Activity</div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5" />
              <div>
                <div className="text-gray-900">Incident detected</div>
                <div className="text-sm text-gray-500">10:15 AM - payment-service</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5" />
              <div>
                <div className="text-gray-900">Service deployed</div>
                <div className="text-sm text-gray-500">9:42 AM - payment-service</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
