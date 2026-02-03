import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [reservations, customers] = await Promise.all([
        api.get('/api/reservations'),
        api.get('/api/customers'),
      ]);
      return {
        totalReservations: reservations.data.length,
        todayReservations: reservations.data.filter((r: any) => {
          const today = new Date().toISOString().split('T')[0];
          return r.date === today;
        }).length,
        totalCustomers: customers.data.length,
        vipCustomers: customers.data.filter((c: any) => c.isVip).length,
      };
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const statCards = [
    { name: 'Total Reservations', value: stats?.totalReservations || 0, icon: '📅' },
    { name: 'Today\'s Reservations', value: stats?.todayReservations || 0, icon: '⏰' },
    { name: 'Total Customers', value: stats?.totalCustomers || 0, icon: '🤝' },
    { name: 'VIP Customers', value: stats?.vipCustomers || 0, icon: '⭐' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">{stat.icon}</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          <button className="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            New Reservation
          </button>
          <button className="px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
            Add Customer
          </button>
          <button className="px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
            Manage Tables
          </button>
          <button className="px-4 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors">
            View Reports
          </button>
        </div>
      </div>
    </div>
  );
}
