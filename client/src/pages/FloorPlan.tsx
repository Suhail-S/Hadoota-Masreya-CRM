import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useState } from 'react';
import TableOrderModal from '../components/TableOrderModal';

interface Table {
  id: string;
  tableNumber: string;
  displayName: string;
  minSeats: number;
  maxSeats: number;
  sectionId: string;
  sectionName?: string;
  positionX?: number;
  positionY?: number;
  status: 'available' | 'occupied' | 'reserved' | 'unavailable';
  currentOrder?: {
    id: string;
    orderNumber: string;
    customerName?: string;
    tableNumber?: string;
  };
  nextReservation?: {
    id: string;
    guestName: string;
    startTime: string;
    partySize: number;
  };
}

interface Section {
  id: string;
  name: string;
  code: string;
  branchName: string;
  tables: Table[];
}

export default function FloorPlan() {
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('19:00'); // Default to 7 PM
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<{ id: string; name: string } | null>(null);

  const { data: sections, isLoading, refetch } = useQuery({
    queryKey: ['floor-plan', selectedDate, selectedTime],
    queryFn: async () => {
      const response = await api.get('/api/tables/floor-plan', {
        params: {
          date: selectedDate,
          time: selectedTime,
        },
      });
      return response.data as Section[];
    },
    refetchInterval: 10000, // Refresh every 10 seconds for live updates
  });

  const handleCheckout = async (reservationId: string, tableName: string) => {
    if (!confirm(`Checkout guest from ${tableName}?`)) {
      return;
    }

    setCheckoutLoading(reservationId);
    try {
      await api.post(`/api/reservations/${reservationId}/checkout`);
      alert('Guest checked out successfully!');
      refetch(); // Refresh the floor plan
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(error.response?.data?.error || 'Failed to checkout guest');
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading floor plan...</div>;
  }

  const filteredSections = selectedSection === 'all'
    ? sections
    : sections?.filter(s => s.id === selectedSection);

  // Color scheme: Green for available, Red for occupied/reserved
  const statusColors = {
    available: 'bg-green-500 hover:bg-green-600',
    occupied: 'bg-red-600 hover:bg-red-700',
    reserved: 'bg-red-500 hover:bg-red-600',
    unavailable: 'bg-gray-400 hover:bg-gray-500',
  };

  const statusLabels = {
    available: 'Available',
    occupied: 'Occupied',
    reserved: 'Reserved',
    unavailable: 'Unavailable',
  };

  // Calculate statistics
  const allTables = sections?.flatMap(s => s.tables) || [];
  const stats = {
    total: allTables.length,
    available: allTables.filter(t => t.status === 'available').length,
    occupied: allTables.filter(t => t.status === 'occupied').length,
    reserved: allTables.filter(t => t.status === 'reserved').length,
  };

  // Generate time slots (from 12:00 PM to 2:00 AM)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 12; hour <= 23; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    // Add early morning slots (12 AM - 2 AM)
    for (let hour = 0; hour <= 2; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  return (
    <div>
      {/* Header with Filters */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Floor Plan - Table Availability</h1>

        {/* Date and Time Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Time Slot
              </label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Section
              </label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Sections</option>
                {sections?.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh Availability
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between bg-white rounded-lg shadow p-4">
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-500 rounded"></div>
              <span className="font-medium">Available ({stats.available})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-600 rounded"></div>
              <span className="font-medium">Occupied ({stats.occupied})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-500 rounded"></div>
              <span className="font-medium">Reserved ({stats.reserved})</span>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            Viewing: <span className="font-medium">{selectedTime} on {selectedDate} </span>
          </div>
        </div>
      </div>

      {/* Floor Plan Grid */}
      <div className="space-y-8">
        {filteredSections?.map((section) => (
          <div key={section.id} className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {section.name} <span className="text-sm text-gray-500">({section.branchName})</span>
            </h2>

            {/* Grid layout for tables */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {section.tables.map((table) => (
                <div
                  key={table.id}
                  onClick={() => setSelectedTable({ id: table.id, name: table.displayName || table.tableNumber })}
                  className={`
                    relative p-4 rounded-lg text-white cursor-pointer
                    transition-all duration-200 transform hover:scale-105 shadow-lg
                    ${statusColors[table.status]}
                    ${table.status === 'unavailable' ? 'opacity-50' : ''}
                  `}
                  title={`${table.displayName || table.tableNumber} - ${statusLabels[table.status]}`}
                >
                  {/* Table Number */}
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-1">{table.tableNumber}</div>
                    <div className="text-xs opacity-90">
                      {table.minSeats === table.maxSeats
                        ? `${table.maxSeats} seats`
                        : `${table.minSeats}-${table.maxSeats} seats`
                      }
                    </div>
                  </div>

                  {/* Status indicator */}
                  <div className="absolute top-2 right-2">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  </div>

                  {/* Status label */}
                  <div className="mt-2 text-center text-xs font-semibold uppercase tracking-wide">
                    {statusLabels[table.status]}
                  </div>

                  {/* Order/Reservation info */}
                  {table.currentOrder && (
                    <div className="mt-2 pt-2 border-t border-white/30 text-xs">
                      <div className="font-medium truncate">
                        {table.currentOrder.customerName || 'Guest'}
                      </div>
                      <div className="opacity-75">#{table.currentOrder.orderNumber}</div>
                    </div>
                  )}

                  {table.nextReservation && !table.currentOrder && (
                    <div className="mt-2 pt-2 border-t border-white/30 text-xs">
                      <div className="font-medium truncate">
                        {table.nextReservation.guestName}
                      </div>
                      <div className="opacity-75">
                        {table.nextReservation.startTime.substring(0, 5)} ({table.nextReservation.partySize} guests)
                      </div>

                      {/* Checkout button for occupied/reserved tables */}
                      {(table.status === 'occupied' || table.status === 'reserved') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCheckout(table.nextReservation!.id, table.displayName || table.tableNumber);
                          }}
                          disabled={checkoutLoading === table.nextReservation.id}
                          className="mt-2 w-full px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          {checkoutLoading === table.nextReservation.id ? 'Checking out...' : 'Checkout'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {section.tables.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No tables in this section
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Order Management Modal */}
      {selectedTable && (
        <TableOrderModal
          tableId={selectedTable.id}
          tableName={selectedTable.name}
          onClose={() => {
            setSelectedTable(null);
            refetch(); // Refresh floor plan when closing
          }}
        />
      )}
    </div>
  );
}
