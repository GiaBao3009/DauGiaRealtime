import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadMessages();
      
      // Setup Socket.IO for real-time notifications
      const socket = io('http://localhost:3001');
      socket.emit('join', user.user_id);
      
      socket.on('new_notification', (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        fetchNotifications(); // Refresh to get full data
      });

      // Poll every 30 seconds as backup
      const interval = setInterval(() => {
        fetchNotifications();
        fetchUnreadMessages();
      }, 30000);
      
      return () => {
        socket.disconnect();
        clearInterval(interval);
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const response = await fetch(`http://localhost:3001/notifications/${user.user_id}?limit=10`);
      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.notifications?.filter(n => !n.is_read).length || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const fetchUnreadMessages = async () => {
    if (!user) return;
    try {
      const response = await fetch(`http://localhost:3001/messages/${user.user_id}/unread-count`);
      const data = await response.json();
      if (data.success) {
        setUnreadMessages(data.unread_count);
      }
    } catch (err) {
      console.error('Error fetching unread messages:', err);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`http://localhost:3001/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      fetchNotifications();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`http://localhost:3001/notifications/user/${user.user_id}/read-all`, {
        method: 'PUT'
      });
      fetchNotifications();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/auctions?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border-dark bg-surface-dark/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-white">
              <span className="material-symbols-outlined text-xl">gavel</span>
            </div>
            <span className="text-lg font-bold text-white hidden sm:block">
              Sàn Đấu Giá
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link to="/" className="nav-link">Trang chủ</Link>
            <Link to="/auctions" className="nav-link">Đấu giá</Link>
            {user && <Link to="/create-auction" className="nav-link">Tạo phiên</Link>}
          </nav>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                className="input w-full pl-10 pr-4 py-2 text-sm"
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-lg">
                search
              </span>
            </div>
          </form>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Messages */}
            {user && (
              <Link 
                to="/messages"
                className="relative size-10 rounded-lg flex items-center justify-center text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
              >
                <span className="material-symbols-outlined">chat</span>
                {unreadMessages > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-primary rounded-full text-white text-[10px] font-bold">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </Link>
            )}

            {/* Notifications */}
            {user && (
              <div className="relative">
                <button 
                  onClick={() => setNotifMenuOpen(!notifMenuOpen)}
                  className="relative size-10 rounded-lg flex items-center justify-center text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
                >
                  <span className="material-symbols-outlined">notifications</span>
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-danger rounded-full text-white text-[10px] font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {notifMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setNotifMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-80 max-h-[500px] rounded-xl border border-border-dark bg-surface-dark shadow-xl z-50 overflow-hidden flex flex-col">
                      {/* Header */}
                      <div className="p-4 border-b border-border-dark flex items-center justify-between">
                        <h3 className="text-white font-bold">Thông báo</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-primary hover:text-primary/80 font-medium"
                          >
                            Đánh dấu tất cả đã đọc
                          </button>
                        )}
                      </div>

                      {/* Notifications List */}
                      <div className="flex-1 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center">
                            <span className="material-symbols-outlined text-5xl text-text-secondary mb-2 block">notifications_off</span>
                            <p className="text-text-secondary">Không có thông báo mới</p>
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.notification_id}
                              onClick={() => {
                                markAsRead(notif.notification_id);
                                if (notif.notification_type === 'message') {
                                  // Redirect to Messages
                                  navigate('/messages');
                                  setNotifMenuOpen(false);
                                } else if (notif.auction_id) {
                                  navigate(`/auction/${notif.auction_id}`);
                                  setNotifMenuOpen(false);
                                }
                              }}
                              className={`p-4 border-b border-border-dark hover:bg-white/5 cursor-pointer transition-colors ${
                                !notif.is_read ? 'bg-primary/5' : ''
                              }`}
                            >
                              <div className="flex gap-3">
                                <div className={`size-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  notif.notification_type === 'outbid' ? 'bg-danger/20 text-danger' :
                                  notif.notification_type === 'won' ? 'bg-success/20 text-success' :
                                  notif.notification_type === 'message' ? 'bg-info/20 text-info' :
                                  'bg-info/20 text-info'
                                }`}>
                                  <span className="material-symbols-outlined text-lg">
                                    {notif.notification_type === 'outbid' ? 'trending_down' :
                                     notif.notification_type === 'won' ? 'emoji_events' :
                                     notif.notification_type === 'message' ? 'chat' :
                                     'info'}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-medium text-sm">{notif.title}</p>
                                  <p className="text-text-secondary text-xs mt-1 line-clamp-2">{notif.message}</p>
                                  {notif.auction_title && (
                                    <p className="text-primary text-xs mt-1">{notif.auction_title}</p>
                                  )}
                                  <p className="text-text-secondary text-xs mt-1">
                                    {new Date(notif.created_at).toLocaleString('vi-VN')}
                                  </p>
                                </div>
                                {!notif.is_read && (
                                  <div className="size-2 rounded-full bg-primary flex-shrink-0 mt-2"></div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* User Menu or Login */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  {user.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt="Avatar" 
                      className="size-8 rounded-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="size-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold"
                    style={{ display: user.avatar_url ? 'none' : 'flex' }}
                  >
                    {(user.full_name || user.email).charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white font-medium hidden lg:block">{user.full_name || user.username}</span>
                  <span className="material-symbols-outlined text-text-secondary">
                    {userMenuOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border-dark bg-surface-dark shadow-xl z-50">
                      <div className="p-4 border-b border-border-dark">
                        <p className="text-white font-medium">{user.full_name || user.username}</p>
                        <p className="text-text-secondary text-sm">{user.email}</p>
                      </div>
                      <div className="py-2">
                        <Link
                          to="/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">dashboard</span>
                          <span>Dashboard</span>
                        </Link>
                        <Link
                          to="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">person</span>
                          <span>Thông tin cá nhân</span>
                        </Link>
                        <Link
                          to="/bid-history"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">history</span>
                          <span>Lịch sử đấu giá</span>
                        </Link>
                        {user.role_id === 1 && (
                          <Link
                            to="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
                          >
                            <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                            <span>Admin Panel</span>
                          </Link>
                        )}
                        <Link
                          to="/create-auction"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">add_circle</span>
                          <span>Tạo phiên đấu giá</span>
                        </Link>
                      </div>
                      <div className="py-2 border-t border-border-dark">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-2.5 text-danger hover:bg-danger/10 transition-colors w-full"
                        >
                          <span className="material-symbols-outlined text-lg">logout</span>
                          <span>Đăng xuất</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn-primary">
                Đăng nhập
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden size-10 rounded-lg flex items-center justify-center text-white hover:bg-white/5"
            >
              <span className="material-symbols-outlined">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border-dark">
            <nav className="flex flex-col gap-2">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 text-text-secondary hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                Trang chủ
              </Link>
              <Link
                to="/auctions"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 text-text-secondary hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                Đấu giá
              </Link>
              {user && (
                <Link
                  to="/create-auction"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 text-text-secondary hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  Tạo phiên
                </Link>
              )}
            </nav>

            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mt-4 px-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm..."
                  className="input w-full pl-10 pr-4 py-2 text-sm"
                />
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-lg">
                  search
                </span>
              </div>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
