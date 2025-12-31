import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState({
    stats: {
      activeBids: 0,
      wonAuctions: 0,
      watching: 0,
      totalSpent: 0
    },
    recentBids: []
  });
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`http://localhost:3001/user/${user.user_id}/dashboard`);
      const data = await response.json();
      setDashboardData({
        stats: {
          activeBids: data.activeBids || 0,
          wonAuctions: data.wonAuctions || 0,
          watching: data.watching || 0,
          totalSpent: data.totalSpent || 0
        },
        recentBids: data.recentBids || []
      });
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { id: 'overview', icon: 'dashboard', label: 'Tổng quan', link: '/dashboard' },
    { id: 'bidding', icon: 'gavel', label: 'Đang đấu giá', link: '/my-bids' },
    { id: 'watchlist', icon: 'bookmark', label: 'Theo dõi', link: '/watchlist' },
    { id: 'selling', icon: 'inventory_2', label: 'Tin đang bán', link: '/my-auctions' },
    { id: 'messages', icon: 'chat', label: 'Tin nhắn', link: '/messages' },
    { id: 'support', icon: 'support_agent', label: 'Liên hệ Admin', link: '/messages?admin=true' },
    { id: 'history', icon: 'history', label: 'Lịch sử', link: '/bid-history' },
    { id: 'settings', icon: 'settings', label: 'Cài đặt', link: '/profile' }
  ];

  const stats = [
    { label: 'Đang tham gia', value: String(dashboardData.stats.activeBids), icon: 'trending_up', color: 'primary' },
    { label: 'Đã thắng', value: String(dashboardData.stats.wonAuctions), icon: 'emoji_events', color: 'warning' },
    { label: 'Đang theo dõi', value: String(dashboardData.stats.watching), icon: 'bookmark', color: 'info' },
    { label: 'Tổng chi tiêu', value: `${(dashboardData.stats.totalSpent / 1000000).toFixed(1)}M`, icon: 'payments', color: 'success' }
  ];

  const recentBids = dashboardData.recentBids;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="min-h-screen flex bg-background-dark">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 border-r border-border-dark bg-surface-dark">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-border-dark">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-white">
              <span className="material-symbols-outlined text-xl">gavel</span>
            </div>
            <span className="text-lg font-bold text-white">Sàn Đấu Giá</span>
          </Link>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-border-dark">
          <div className="flex items-center gap-4">
            <div className="relative">
              {user?.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt="Avatar" 
                  className="size-14 rounded-full ring-2 ring-primary/30 object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="size-14 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold ring-2 ring-primary/30"
                style={{ display: user?.avatar_url ? 'none' : 'flex' }}
              >
                {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <span className="absolute bottom-0 right-0 size-4 bg-success rounded-full border-2 border-surface-dark" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold truncate">{user?.full_name || user?.username || 'User'}</h3>
              <p className="text-text-secondary text-sm">{user?.role_id === 1 ? 'Admin' : 'Thành viên VIP'}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.link}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    activeTab === item.id
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border-dark">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-danger hover:bg-danger/10 transition-colors text-sm font-medium"
          >
            <span className="material-symbols-outlined">logout</span>
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border-dark flex items-center justify-between px-6 bg-surface-dark/80 backdrop-blur sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button className="lg:hidden size-10 rounded-lg bg-white/5 flex items-center justify-center text-white">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h2 className="text-lg font-bold text-white">
              {menuItems.find(item => item.id === activeTab)?.label || 'Tổng quan'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="size-10 rounded-lg bg-white/5 flex items-center justify-center text-text-secondary hover:text-white hover:bg-white/10 transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 size-2 bg-danger rounded-full" />
            </button>
            <Link to="/auctions" className="btn-primary h-10 px-4 hidden sm:flex">
              <span className="material-symbols-outlined text-lg">add</span>
              Đấu giá mới
            </Link>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <div key={index} className="card group hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-text-secondary text-sm mb-2">{stat.label}</p>
                      <p className="text-white text-3xl font-bold">{stat.value}</p>
                    </div>
                    <div className={`size-12 rounded-xl flex items-center justify-center ${
                      stat.color === 'primary' ? 'bg-primary/10 text-primary' :
                      stat.color === 'warning' ? 'bg-warning/10 text-warning' :
                      stat.color === 'success' ? 'bg-success/10 text-success' :
                      'bg-info/10 text-info'
                    }`}>
                      <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Bids */}
            <div className="card p-0">
              <div className="p-6 border-b border-border-dark flex items-center justify-between">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">history</span>
                  Hoạt động gần đây
                </h3>
                <button className="text-primary text-sm font-medium hover:underline">
                  Xem tất cả
                </button>
              </div>
              <div className="divide-y divide-border-dark">
                {recentBids.map((bid, index) => (
                  <div key={bid.auction_id || index} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
                    <img 
                      src={bid.image_url || 'https://via.placeholder.com/64?text=No+Image'} 
                      alt={bid.product || 'Sản phẩm'}
                      className="size-16 rounded-lg object-cover"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/64?text=No+Image'; }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium truncate">{bid.product || 'Sản phẩm'}</h4>
                      <p className="text-text-secondary text-sm">
                        {bid.time ? new Date(bid.time).toLocaleString('vi-VN') : 'Chưa có thông tin'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-primary font-bold">{formatPrice(bid.price || 0)}</p>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                        bid.status === 'ACTIVE' 
                          ? 'bg-success/10 text-success' 
                          : 'bg-danger/10 text-danger'
                      }`}>
                        <span className="material-symbols-outlined text-sm">
                          {bid.status === 'ACTIVE' ? 'trending_up' : 'trending_down'}
                        </span>
                        {bid.status === 'ACTIVE' ? 'Đang dẫn' : 'Đã bị vượt'}
                      </span>
                    </div>
                    <Link 
                      to={`/auction/${bid.auction_id}`}
                      className="size-10 rounded-lg bg-white/5 flex items-center justify-center text-text-secondary hover:text-white hover:bg-primary transition-colors"
                    >
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link to="/auctions" className="card group hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-2xl">explore</span>
                  </div>
                  <div>
                    <h4 className="text-white font-bold">Khám phá</h4>
                    <p className="text-text-secondary text-sm">Tìm sản phẩm mới</p>
                  </div>
                </div>
              </Link>
              <Link to="/" className="card group hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-warning/10 text-warning flex items-center justify-center group-hover:bg-warning group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-2xl">sell</span>
                  </div>
                  <div>
                    <h4 className="text-white font-bold">Bán hàng</h4>
                    <p className="text-text-secondary text-sm">Tạo phiên đấu giá</p>
                  </div>
                </div>
              </Link>
              <Link to="/" className="card group hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-info/10 text-info flex items-center justify-center group-hover:bg-info group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-2xl">help</span>
                  </div>
                  <div>
                    <h4 className="text-white font-bold">Hỗ trợ</h4>
                    <p className="text-text-secondary text-sm">Trung tâm trợ giúp</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default UserDashboard;