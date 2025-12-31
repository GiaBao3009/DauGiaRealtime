import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import io from 'socket.io-client';

function Messages() {
  const { user } = useAuth();
  const { otherUserId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  // Setup Socket.IO
  useEffect(() => {
    if (user) {
      const newSocket = io('http://localhost:3001');
      newSocket.emit('join', user.user_id);
      
      newSocket.on('new_message', (message) => {
        // If message is from current conversation, add it
        if (selectedUser && 
            (message.sender_id === selectedUser.other_user_id || 
             message.receiver_id === selectedUser.other_user_id)) {
          setMessages(prev => [...prev, message]);
          scrollToBottom();
        }
        // Refresh conversations list
        fetchConversations();
      });

      setSocket(newSocket);
      return () => newSocket.close();
    }
  }, [user, selectedUser]);

  useEffect(() => {
    if (user) {
      fetchConversations();
      
      // Nếu có param ?admin=true → tự động mở chat với admin
      const params = new URLSearchParams(location.search);
      if (params.get('admin') === 'true') {
        fetchAdminInfo();
      }
    }
  }, [user, location.search]);

  useEffect(() => {
    if (otherUserId && conversations.length > 0) {
      const conversation = conversations.find(c => c.other_user_id === parseInt(otherUserId));
      if (conversation) {
        selectConversation(conversation);
      } else {
        // Create new conversation
        fetchUserInfo(otherUserId);
      }
    }
  }, [otherUserId, conversations]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch(`http://localhost:3001/messages/${user.user_id}/conversations`);
      const data = await response.json();
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  };

  const fetchUserInfo = async (userId) => {
    try {
      const response = await fetch(`http://localhost:3001/user/${userId}`);
      const data = await response.json();
      if (data.user) {
        setSelectedUser({
          other_user_id: parseInt(userId),
          username: data.user.username,
          full_name: data.user.full_name,
          email: data.user.email,
          avatar_url: data.user.avatar_url
        });
        fetchMessages(userId);
      }
    } catch (err) {
      console.error('Error fetching user info:', err);
    }
  };

  const fetchAdminInfo = async () => {
    try {
      console.log('Fetching admin info...');
      const response = await fetch('http://localhost:3001/users/admin');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const text = await response.text();
        console.error('Response error:', text);
        alert('Không thể kết nối với Admin. Vui lòng thử lại sau.');
        return;
      }
      
      const data = await response.json();
      console.log('Admin data:', data);
      
      if (data.success && data.user) {
        setSelectedUser({
          other_user_id: data.user.user_id,
          username: data.user.username,
          full_name: data.user.full_name || 'Admin',
          email: data.user.email,
          avatar_url: data.user.avatar_url
        });
        fetchMessages(data.user.user_id);
      } else {
        alert('Không tìm thấy Admin trong hệ thống.');
      }
    } catch (err) {
      console.error('Error fetching admin info:', err);
      alert('Lỗi kết nối. Vui lòng kiểm tra backend đã chạy chưa.');
    }
  };

  const selectConversation = async (conversation) => {
    setSelectedUser(conversation);
    fetchMessages(conversation.other_user_id);
  };

  const fetchMessages = async (userId) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/messages/${user.user_id}/${userId}`);
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    const auctionId = location.state?.auctionId || null;

    try {
      const response = await fetch('http://localhost:3001/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: user.user_id,
          receiver_id: selectedUser.other_user_id,
          auction_id: auctionId,
          message_content: newMessage
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessages([...messages, data.message]);
        setNewMessage('');
        scrollToBottom();
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="min-h-screen bg-background-dark">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-6">Tin nhắn</h1>

        <div className="card p-0 overflow-hidden" style={{ height: 'calc(100vh - 240px)' }}>
          <div className="flex h-full">
            {/* Conversations List */}
            <div className="w-80 border-r border-border-dark overflow-y-auto">
              <div className="p-4 border-b border-border-dark">
                <h2 className="text-white font-bold">Cuộc trò chuyện</h2>
              </div>

              {conversations.length === 0 ? (
                <div className="p-8 text-center space-y-4">
                  <span className="material-symbols-outlined text-4xl text-text-secondary mb-2">
                    chat_bubble_outline
                  </span>
                  <p className="text-text-secondary text-sm mb-4">Chưa có cuộc trò chuyện nào</p>
                  
                  {/* Nút nhắn Admin */}
                  <button
                    onClick={fetchAdminInfo}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">support_agent</span>
                    Nhắn tin với Admin
                  </button>
                </div>
              ) : (
                <div>
                  {conversations.map((conv) => (
                    <button
                      key={conv.other_user_id}
                      onClick={() => selectConversation(conv)}
                      className={`w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors border-b border-border-dark ${
                        selectedUser?.other_user_id === conv.other_user_id ? 'bg-white/10' : ''
                      }`}
                    >
                      {conv.avatar_url ? (
                        <img
                          src={conv.avatar_url}
                          alt="Avatar"
                          className="size-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="size-12 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                          {(conv.full_name || conv.email).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-white font-medium truncate">
                            {conv.full_name || conv.username}
                          </p>
                          <span className="text-text-secondary text-xs">
                            {formatTime(conv.last_message_time)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-text-secondary text-sm truncate">
                            {conv.last_sender_id === user.user_id ? 'Bạn: ' : ''}
                            {conv.last_message}
                          </p>
                          {conv.unread_count > 0 && (
                            <span className="ml-2 bg-danger text-white text-xs font-bold size-5 rounded-full flex items-center justify-center">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Chat Area */}
            {selectedUser ? (
              <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b border-border-dark flex items-center gap-3">
                  {selectedUser.avatar_url ? (
                    <img
                      src={selectedUser.avatar_url}
                      alt="Avatar"
                      className="size-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="size-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                      {(selectedUser.full_name || selectedUser.email).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-white font-bold">
                      {selectedUser.full_name || selectedUser.username}
                    </h3>
                    <p className="text-text-secondary text-sm">{selectedUser.email}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="size-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12">
                      <span className="material-symbols-outlined text-4xl text-text-secondary mb-2">
                        chat
                      </span>
                      <p className="text-text-secondary">Chưa có tin nhắn nào</p>
                      <p className="text-text-secondary text-sm">Bắt đầu cuộc trò chuyện ngay!</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isMine = msg.sender_id === user.user_id;
                      return (
                        <div
                          key={msg.message_id || index}
                          className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              isMine
                                ? 'bg-primary text-white'
                                : 'bg-surface-dark text-white'
                            }`}
                          >
                            {msg.auction_product_name && (
                              <div className="mb-2 pb-2 border-b border-white/20">
                                <p className="text-xs opacity-75">
                                  📦 {msg.auction_product_name}
                                </p>
                              </div>
                            )}
                            <p className="break-words">{msg.message_content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isMine ? 'text-white/70' : 'text-text-secondary'
                              }`}
                            >
                              {new Date(msg.sent_at).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={sendMessage} className="p-4 border-t border-border-dark">
                  {location.state?.productName && (
                    <div className="mb-2 p-2 bg-primary/10 rounded-lg border border-primary/20">
                      <p className="text-primary text-sm">
                        📦 Đang nhắn về: <span className="font-medium">{location.state.productName}</span>
                      </p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Nhập tin nhắn..."
                      className="input flex-1"
                    />
                    <button type="submit" className="btn-primary">
                      <span className="material-symbols-outlined">send</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* No Chat Selected */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <span className="material-symbols-outlined text-6xl text-text-secondary mb-4">
                    forum
                  </span>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Chọn một cuộc trò chuyện
                  </h3>
                  <p className="text-text-secondary">
                    Hoặc bắt đầu cuộc trò chuyện mới từ trang đấu giá
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Messages;
