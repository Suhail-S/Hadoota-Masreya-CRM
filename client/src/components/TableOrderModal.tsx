import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

interface OrderItem {
  id: string;
  menuItemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  id: string;
  orderNumber: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  items: OrderItem[];
}

interface MenuItem {
  id: string;
  name: string;
  nameAr?: string;
  price: number;
  category?: string;
}

interface TableOrderModalProps {
  tableId: string;
  tableName: string;
  onClose: () => void;
}

export default function TableOrderModal({ tableId, tableName, onClose }: TableOrderModalProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [showMenuItems, setShowMenuItems] = useState(false);
  const queryClient = useQueryClient();

  // Fetch menu items
  const { data: menuItems = [] } = useQuery({
    queryKey: ['menu-items'],
    queryFn: async () => {
      const response = await api.get('/api/menu-items');
      return response.data as MenuItem[];
    },
  });

  // Get or create order for table
  useEffect(() => {
    const initOrder = async () => {
      try {
        // Try to get existing order
        try {
          const response = await api.get(`/api/tables/${tableId}/order`);
          setOrder(response.data);
        } catch (error: any) {
          // If no order exists, create one
          if (error.response?.status === 404) {
            const response = await api.post(`/api/tables/${tableId}/order`);
            const newOrder = { ...response.data, items: [] };
            setOrder(newOrder);
          } else {
            throw error;
          }
        }
      } catch (error) {
        console.error('Failed to initialize order:', error);
        alert('Failed to load order');
      }
    };

    initOrder();
  }, [tableId]);

  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: async (menuItemId: string) => {
      const response = await api.post(`/api/orders/${order?.id}/items`, {
        menuItemId,
        quantity: 1,
      });
      return response.data;
    },
    onSuccess: (data) => {
      setOrder(data.order);
      queryClient.invalidateQueries({ queryKey: ['floor-plan'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to add item');
    },
  });

  // Update item quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const response = await api.patch(`/api/orders/${order?.id}/items/${itemId}`, { quantity });
      return response.data;
    },
    onSuccess: (data) => {
      setOrder(data.order);
      queryClient.invalidateQueries({ queryKey: ['floor-plan'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to update quantity');
    },
  });

  // Remove item mutation
  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await api.delete(`/api/orders/${order?.id}/items/${itemId}`);
      return response.data;
    },
    onSuccess: (data) => {
      setOrder(data.order);
      queryClient.invalidateQueries({ queryKey: ['floor-plan'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to remove item');
    },
  });

  const formatPrice = (price: number) => {
    return `AED ${price.toFixed(2)}`;
  };

  if (!order) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="text-lg">Loading order...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">{tableName}</h2>
            <p className="text-sm opacity-90">Order #{order.orderNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-700 rounded-full p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Current Order Items */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Current Order</h3>

            {order.items.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                No items added yet. Click "Add Items" to start.
              </div>
            ) : (
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-gray-50 p-4 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{item.itemName}</div>
                      <div className="text-sm text-gray-500">
                        {formatPrice(item.unitPrice)} each
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="font-semibold min-w-[80px] text-right">
                        {formatPrice(item.totalPrice)}
                      </div>
                      <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-300">
                        <button
                          onClick={() => updateQuantityMutation.mutate({ itemId: item.id, quantity: item.quantity - 1 })}
                          disabled={updateQuantityMutation.isPending || item.quantity <= 1}
                          className="px-3 py-1 text-gray-600 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          −
                        </button>
                        <span className="px-2 font-medium min-w-[30px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantityMutation.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                          disabled={updateQuantityMutation.isPending}
                          className="px-3 py-1 text-gray-600 hover:text-gray-800 disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItemMutation.mutate(item.id)}
                        disabled={removeItemMutation.isPending}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50 p-1"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Menu Items Selector */}
          {showMenuItems && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Add Items</h3>
                <button
                  onClick={() => setShowMenuItems(false)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Hide Menu
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addItemMutation.mutate(item.id)}
                    disabled={addItemMutation.isPending}
                    className="bg-white border-2 border-gray-200 hover:border-blue-500 rounded-lg p-4 text-left transition-colors disabled:opacity-50"
                  >
                    <div className="font-medium mb-1">{item.name}</div>
                    <div className="text-sm text-blue-600 font-semibold">
                      {formatPrice(item.price)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Totals */}
        <div className="border-t p-6 bg-gray-50">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tax (5%):</span>
              <span>{formatPrice(order.taxAmount)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold border-t pt-2">
              <span>Total:</span>
              <span>{formatPrice(order.totalAmount)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            {!showMenuItems ? (
              <button
                onClick={() => setShowMenuItems(true)}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Add Items
              </button>
            ) : null}
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
