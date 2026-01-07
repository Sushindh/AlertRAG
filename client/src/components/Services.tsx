import { AlertCircle, CheckCircle, ChevronRight } from 'lucide-react';

interface ServicesProps {
  onNavigate: (page: 'incidents') => void;
}

export function Services({ onNavigate }: ServicesProps) {
  const services = [
    {
      name: 'payment-service',
      status: 'degraded',
      latency: '5.2s',
      errorRate: '12.4%',
    },
    {
      name: 'order-service',
      status: 'healthy',
      latency: '124ms',
      errorRate: '0.1%',
    },
    {
      name: 'checkout-service',
      status: 'healthy',
      latency: '98ms',
      errorRate: '0.2%',
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">Services</h1>
        <p className="text-gray-600">Monitor the health and performance of your services</p>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm text-gray-500">Service Name</th>
              <th className="text-left px-6 py-4 text-sm text-gray-500">Status</th>
              <th className="text-left px-6 py-4 text-sm text-gray-500">Avg Latency</th>
              <th className="text-left px-6 py-4 text-sm text-gray-500">Error Rate</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {services.map((service) => (
              <tr
                key={service.name}
                onClick={() => service.status === 'degraded' && onNavigate('incidents')}
                className={`${
                  service.status === 'degraded'
                    ? 'cursor-pointer hover:bg-red-50'
                    : 'hover:bg-gray-50'
                } transition-colors`}
              >
                <td className="px-6 py-4">
                  <div className="text-gray-900">{service.name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {service.status === 'degraded' ? (
                      <>
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="text-red-600">Degraded</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-green-600">Healthy</span>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={
                      service.status === 'degraded' ? 'text-red-600' : 'text-gray-900'
                    }
                  >
                    {service.latency}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={
                      service.status === 'degraded' ? 'text-red-600' : 'text-gray-900'
                    }
                  >
                    {service.errorRate}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {service.status === 'degraded' && (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Service Details */}
      <div className="mt-6 grid grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="text-sm text-gray-500 mb-2">Total Services</div>
          <div className="text-2xl text-gray-900">3</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="text-sm text-gray-500 mb-2">Healthy Services</div>
          <div className="text-2xl text-green-600">2</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="text-sm text-gray-500 mb-2">Degraded Services</div>
          <div className="text-2xl text-red-600">1</div>
        </div>
      </div>
    </div>
  );
}
