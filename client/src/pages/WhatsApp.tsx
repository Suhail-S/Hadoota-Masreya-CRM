import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

interface Message {
  id: string;
  whatsappMessageId: string;
  direction: 'inbound' | 'outbound';
  content: string;
  messageType: string;
  status: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  customerPhone: string;
  customerName: string | null;
  status: 'active' | 'resolved' | 'bot_handled';
  lastMessageAt: string;
  unreadCount: number;
}

export default function WhatsApp() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();

  // Fetch conversations
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['whatsapp-conversations'],
    queryFn: async () => {
      const response = await api.get('/api/whatsapp/conversations');
      return response.data;
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch messages for selected conversation
  const { data: conversationData, isLoading: messagesLoading } = useQuery({
    queryKey: ['whatsapp-conversation', selectedConversationId],
    queryFn: async () => {
      const response = await api.get(`/api/whatsapp/conversations/${selectedConversationId}`);
      return response.data;
    },
    enabled: !!selectedConversationId,
    refetchInterval: 3000, // Refresh every 3 seconds when viewing
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      await api.post(`/api/whatsapp/conversations/${selectedConversationId}/message`, {
        message: text,
      });
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversation', selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
    },
  });

  // Takeover conversation mutation
  const takeoverMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/api/whatsapp/conversations/${selectedConversationId}/takeover`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversation', selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessageMutation.mutate(message);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const selectedConversation = conversations?.find((c: Conversation) => c.id === selectedConversationId);

  return (
    <div className="h-[calc(100vh-8rem)]">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">WhatsApp Manager</h1>

      <div className="bg-white shadow rounded-lg overflow-hidden flex h-full">
        {/* Conversations List */}
        <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Conversations</h2>
          </div>

          {conversationsLoading ? (
            <div className="p-4 text-gray-500">Loading conversations...</div>
          ) : conversations?.length === 0 ? (
            <div className="p-4 text-gray-500 text-center">No conversations yet</div>
          ) : (
            <div>
              {conversations?.map((conversation: Conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversationId(conversation.id)}
                  className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                    selectedConversationId === conversation.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-semibold text-gray-900">
                      {conversation.customerName || conversation.customerPhone}
                    </div>
                    {conversation.unreadCount > 0 && (
                      <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">{conversation.customerPhone}</div>
                  <div className="flex justify-between items-center mt-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        conversation.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : conversation.status === 'bot_handled'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {conversation.status === 'bot_handled' ? 'Bot' : conversation.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(conversation.lastMessageAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="w-2/3 flex flex-col">
          {!selectedConversationId ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a conversation to start chatting
            </div>
          ) : messagesLoading ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Loading messages...
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-gray-900">
                    {selectedConversation?.customerName || selectedConversation?.customerPhone}
                  </div>
                  <div className="text-sm text-gray-600">{selectedConversation?.customerPhone}</div>
                </div>
                {conversationData?.conversation?.status === 'bot_handled' && (
                  <button
                    onClick={() => takeoverMutation.mutate()}
                    disabled={takeoverMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {takeoverMutation.isPending ? 'Taking over...' : 'Take Over'}
                  </button>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {conversationData?.messages?.map((msg: Message) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.direction === 'outbound'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <div className="break-words">{msg.content}</div>
                      <div
                        className={`text-xs mt-1 ${
                          msg.direction === 'outbound' ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {formatTime(msg.createdAt)}
                        {msg.direction === 'outbound' && msg.status && (
                          <span className="ml-2">
                            {msg.status === 'read' && '✓✓'}
                            {msg.status === 'delivered' && '✓'}
                            {msg.status === 'sent' && '⏱'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 bg-gray-50 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={sendMessageMutation.isPending}
                  />
                  <button
                    type="submit"
                    disabled={sendMessageMutation.isPending || !message.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendMessageMutation.isPending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
