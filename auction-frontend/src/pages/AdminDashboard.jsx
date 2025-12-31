import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [auctions, setAuctions] = useState([]);
  const [users, setUsers] = useState([]);
  const [fraudReports, setFraudReports] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({
    activeAuctions: 0,
    waitingToStart: 0,
    pendingAuctions: 0,
    totalValue: 0,
    fraudAlerts: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [settings, setSettings] = useState({
    autoApprove: false,
    emailNotifications: true
  });
  const itemsPerPage = 10;

  useEffect(() => {
    fetchStats();
    fetchAuctions();
    fetchRecentActivities();
    fetchAlerts();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'fraud') {
      fetchFraudReports();
    } else if (activeTab === 'reports') {
      fetchStatistics();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:3001/admin/stats');
      const data = await response.json();
      setStats({
        activeAuctions: data.active || 0,
        waitingToStart: data.waitingToStart || 0,
        pendingAuctions: data.pending || 0,
        totalValue: data.totalValue || 0,
        fraudAlerts: 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const response = await fetch('http://localhost:3001/admin/recent-activities');
      const data = await response.json();
      if (data.success) {
        setRecentActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch('http://localhost:3001/admin/alerts');
      const data = await response.json();
      if (data.success) {
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:3001/admin/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchFraudReports = async () => {
    try {
      const response = await fetch('http://localhost:3001/admin/fraud-reports');
      const data = await response.json();
      if (data.success) {
        setFraudReports(data.reports || []);
      }
    } catch (error) {
      console.error('Error fetching fraud reports:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch('http://localhost:3001/admin/statistics');
      const data = await response.json();
      if (data.success) {
        setStatistics(data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchAuctions = async () => {
    try {
      const response = await fetch('http://localhost:3001/auctions?limit=100');
      const data = await response.json();
      setAuctions(data.auctions || []);
    } catch (error) {
      console.error('Error fetching auctions:', error);
    }
  };

  const handleDeleteAuction = async (auctionId) => {
    if (!confirm('Bạn có chắc muốn xóa phiên đấu giá này?')) return;
    
    try {
      const response = await fetch(`http://localhost:3001/auctions/${auctionId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Đã xóa phiên đấu giá');
        fetchAuctions();
        fetchStats();
      } else {
        alert(data.message || 'Không thể xóa phiên đấu giá');
      }
    } catch (err) {
      console.error('Error deleting auction:', err);
      alert('Lỗi khi xóa phiên đấu giá');
    }
  };

  const handleApproveAuction = async (auctionId) => {
    if (!confirm('Bạn có chắc muốn duyệt phiên đấu giá này?')) return;
    
    try {
      const response = await fetch(`http://localhost:3001/admin/auctions/${auctionId}/approve`, {
        method: 'PUT'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Đã duyệt phiên đấu giá thành công!');
        fetchAuctions();
        fetchStats();
      } else {
        alert(data.message || 'Không thể duyệt phiên đấu giá');
      }
    } catch (err) {
      console.error('Error approving auction:', err);
      alert('Lỗi khi duyệt phiên đấu giá');
    }
  };

  const handleRejectAuction = async (auctionId) => {
    if (!confirm('Bạn có chắc muốn từ chối phiên đấu giá này?')) return;
    
    try {
      const response = await fetch(`http://localhost:3001/admin/auctions/${auctionId}/reject`, {
        method: 'PUT'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Đã từ chối phiên đấu giá');
        fetchAuctions();
        fetchStats();
      } else {
        alert(data.message || 'Không thể từ chối phiên đấu giá');
      }
    } catch (err) {
      console.error('Error rejecting auction:', err);
      alert('Lỗi khi từ chối phiên đấu giá');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const menuItems = [
    { id: 'overview', icon: 'dashboard', label: 'Tổng quan' },
    { id: 'auctions', icon: 'gavel', label: 'Phiên đấu giá', badge: auctions.length },
    { id: 'users', icon: 'group', label: 'Người dùng', badge: users.length },
    { id: 'fraud', icon: 'security', label: 'Chống gian lận', badge: fraudReports.filter(r => r.risk_level === 'Cao').length, badgeColor: 'danger' },
    { id: 'reports', icon: 'analytics', label: 'Báo cáo' },
    { id: 'settings', icon: 'settings', label: 'Cài đặt' }
  ];

  const statsDisplay = [
    { label: 'Đang diễn ra', value: String(stats.activeAuctions || 0), change: stats.activeAuctions > 0 ? `+${stats.activeAuctions}` : '0', icon: 'play_circle', color: 'success' },
    { label: 'Đang chờ lên sàn', value: String(stats.waitingToStart || 0), info: 'Đã duyệt', icon: 'schedule', color: 'info' },
    { label: 'Chờ duyệt', value: String(stats.pendingAuctions || 0), info: 'Cần xử lý', icon: 'pending', color: 'warning' },
    { label: 'Tổng giá trị', value: `${((stats.totalValue || 0) / 1000000000).toFixed(1)} Tỷ`, change: stats.totalValue > 0 ? '+12%' : '0%', icon: 'payments', color: 'primary' }
  ];

  const filteredAuctions = auctions.filter(auction => {
    const matchesSearch = auction.title?.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesStatus = false;
    
    if (statusFilter === 'all') {
      matchesStatus = true;
    } else if (statusFilter === 'waiting') {
      matchesStatus = auction.status === 'ACTIVE' && new Date(auction.start_time) > new Date();
    } else if (statusFilter === 'active') {
      matchesStatus = auction.status === 'ACTIVE' && new Date(auction.start_time) <= new Date();
    } else {
      matchesStatus = auction.status === statusFilter.toUpperCase();
    }
    
    return matchesSearch && matchesStatus;
  });

  const paginatedAuctions = filteredAuctions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredAuctions.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-dark via-surface-dark to-background-dark flex">
      {/* Sidebar */}
      <aside className="w-64 bg-surface-dark/80 backdrop-blur border-r border-border-dark flex flex-col">
        <div className="p-6 border-b border-border-dark">
          <Link to="/" className="flex items-center gap-3 text-white hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-3xl">verified</span>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AuctionHub
              </h1>
              <p className="text-xs text-text-secondary">Admin Panel</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative group ${
                activeTab === item.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'text-text-secondary hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
              {item.badge > 0 && (
                <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-bold ${
                  item.badgeColor === 'danger' ? 'bg-danger text-white' : 'bg-white/10 text-white'
                }`}>
                  {item.badge}
                </span>
              )}
              {activeTab === item.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border-dark">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 mb-3">
            <div className="size-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
              {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">{user?.full_name || user?.username}</p>
              <p className="text-xs text-text-secondary">Quản trị viên</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-text-secondary hover:bg-danger/10 hover:text-danger transition-colors"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-medium">Đăng xuất</span>
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
            <div>
              <h2 className="text-lg font-bold text-white">
                {activeTab === 'overview' && 'Tổng quan'}
                {activeTab === 'auctions' && 'Quản lý phiên đấu giá'}
                {activeTab === 'users' && 'Quản lý người dùng'}
                {activeTab === 'fraud' && 'Chống gian lận'}
                {activeTab === 'reports' && 'Báo cáo & Thống kê'}
                {activeTab === 'settings' && 'Cài đặt hệ thống'}
              </h2>
              <p className="text-text-secondary text-sm hidden sm:block">
                {activeTab === 'overview' && 'Thống kê tổng quan và hoạt động gần đây'}
                {activeTab === 'auctions' && 'Theo dõi và kiểm soát các phiên đấu giá'}
                {activeTab === 'users' && 'Danh sách tất cả người dùng trong hệ thống'}
                {activeTab === 'fraud' && 'Giám sát và xử lý các hành vi gian lận'}
                {activeTab === 'reports' && 'Phân tích dữ liệu và tạo báo cáo'}
                {activeTab === 'settings' && 'Cấu hình và tùy chỉnh hệ thống'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-2 rounded-full bg-success/10 px-3 py-1.5 text-xs font-medium text-success">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-success" />
              </span>
              Hệ thống hoạt động
            </span>
            <button className="size-10 rounded-lg bg-white/5 flex items-center justify-center text-text-secondary hover:text-white hover:bg-white/10 transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              {alerts.length > 0 && (
                <span className="absolute top-2 right-2 size-2 bg-danger rounded-full" />
              )}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
                {statsDisplay.map((stat, index) => (
                  <div key={index} className="bg-surface-dark/80 backdrop-blur border border-border-dark rounded-xl p-6 hover:border-primary/30 transition-all group">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`size-12 rounded-lg bg-${stat.color}/10 flex items-center justify-center text-${stat.color} group-hover:scale-110 transition-transform`}>
                        <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
                      </div>
                      {stat.change && (
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${stat.change.startsWith('+') && stat.change !== '+0' ? 'bg-success/10 text-success' : 'bg-white/10 text-text-secondary'}`}>
                          {stat.change}
                        </span>
                      )}
                      {stat.info && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-white/5 text-text-secondary">
                          {stat.info}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                      <p className="text-sm text-text-secondary">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Activities and Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activities */}
                <div className="bg-surface-dark/80 backdrop-blur border border-border-dark rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">history</span>
                    Hoạt động gần đây
                  </h3>
                  <div className="space-y-3">
                    {recentActivities.length > 0 ? (
                      recentActivities.map((activity, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                          <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined">gavel</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium truncate">{activity.user_name}</p>
                            <p className="text-xs text-text-secondary truncate">Đặt giá {formatPrice(activity.bid_amount)} cho "{activity.product_name}"</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-text-secondary whitespace-nowrap">
                              {new Date(activity.bid_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-text-secondary">
                        <span className="material-symbols-outlined text-4xl mb-2 opacity-50">history</span>
                        <p>Chưa có hoạt động nào</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* System Alerts */}
                <div className="bg-surface-dark/80 backdrop-blur border border-border-dark rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-warning">notifications_active</span>
                    Thông báo hệ thống
                  </h3>
                  <div className="space-y-3">
                    {alerts.length > 0 ? (
                      alerts.map((alert, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                          <div className={`size-10 rounded-full flex items-center justify-center ${
                            alert.alert_type.includes('HOT') ? 'bg-danger/20 text-danger' :
                            alert.alert_type.includes('sắp bắt đầu') ? 'bg-warning/20 text-warning' :
                            alert.alert_type.includes('kết thúc') ? 'bg-info/20 text-info' :
                            'bg-success/20 text-success'
                          }`}>
                            <span className="material-symbols-outlined text-xl">
                              {alert.alert_type.includes('HOT') ? 'local_fire_department' :
                               alert.alert_type.includes('sắp') ? 'schedule' :
                               alert.alert_type.includes('kết thúc') ? 'check_circle' : 'info'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium">{alert.alert_type}</p>
                            <p className="text-xs text-text-secondary truncate">{alert.product_name}</p>
                            <p className="text-xs text-text-secondary mt-1">{alert.total_bids} lượt đặt giá • {formatPrice(alert.current_price)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-text-secondary">
                        <span className="material-symbols-outlined text-4xl mb-2 opacity-50">notifications_off</span>
                        <p>Không có thông báo mới</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Auctions Tab */}
          {activeTab === 'auctions' && (
            <>
              <div className="bg-surface-dark/80 backdrop-blur border border-border-dark rounded-xl p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">search</span>
                    <input
                      type="text"
                      placeholder="Tìm kiếm phiên đấu giá..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-background-dark border border-border-dark rounded-lg text-white placeholder-text-secondary focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 bg-background-dark border border-border-dark rounded-lg text-white focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="pending">Chờ duyệt</option>
                    <option value="waiting">Đang chờ lên sàn</option>
                    <option value="active">Đang diễn ra</option>
                    <option value="completed">Đã kết thúc</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                </div>
              </div>

              <div className="bg-surface-dark/80 backdrop-blur border border-border-dark rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border-dark">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Sản phẩm</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Người bán</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Giá hiện tại</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Lượt đấu</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Trạng thái</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedAuctions.map((auction) => (
                        <tr key={auction.auction_id} className="border-b border-border-dark/50 hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={auction.image_url || '/placeholder.jpg'}
                                alt={auction.title}
                                className="size-12 rounded-lg object-cover"
                              />
                              <div>
                                <p className="text-sm font-medium text-white">{auction.title}</p>
                                <p className="text-xs text-text-secondary">ID: {auction.auction_id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-text-secondary">{auction.seller_name}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-white">{formatPrice(auction.current_price)}</td>
                          <td className="px-6 py-4 text-sm text-text-secondary">{auction.total_bids || 0}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              auction.status === 'ACTIVE' && new Date(auction.start_time) > new Date() ? 'bg-info/10 text-info' :
                              auction.status === 'ACTIVE' ? 'bg-success/10 text-success' :
                              auction.status === 'PENDING' ? 'bg-warning/10 text-warning' :
                              auction.status === 'COMPLETED' ? 'bg-primary/10 text-primary' :
                              'bg-danger/10 text-danger'
                            }`}>
                              {auction.status === 'ACTIVE' && new Date(auction.start_time) > new Date() ? 'Đang chờ lên sàn' :
                               auction.status === 'ACTIVE' ? 'Đang diễn ra' :
                               auction.status === 'PENDING' ? 'Chờ duyệt' :
                               auction.status === 'COMPLETED' ? 'Đã kết thúc' : 'Đã hủy'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/auction/${auction.auction_id}`}
                                className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                title="Xem chi tiết"
                              >
                                <span className="material-symbols-outlined text-sm">visibility</span>
                              </Link>
                              {auction.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => handleApproveAuction(auction.auction_id)}
                                    className="p-2 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors"
                                    title="Duyệt phiên đấu giá"
                                  >
                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                  </button>
                                  <button
                                    onClick={() => handleRejectAuction(auction.auction_id)}
                                    className="p-2 rounded-lg bg-warning/10 text-warning hover:bg-warning/20 transition-colors"
                                    title="Từ chối"
                                  >
                                    <span className="material-symbols-outlined text-sm">cancel</span>
                                  </button>
                                </>
                              )}
                              {auction.status !== 'ACTIVE' && (
                                <button
                                  onClick={() => handleDeleteAuction(auction.auction_id)}
                                  className="p-2 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
                                  title="Xóa phiên đấu giá"
                                >
                                  <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-border-dark">
                    <p className="text-sm text-text-secondary">
                      Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredAuctions.length)} trong tổng số {filteredAuctions.length}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-lg bg-white/5 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                      >
                        Trước
                      </button>
                      <span className="px-4 py-2 rounded-lg bg-primary text-white">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-lg bg-white/5 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="bg-surface-dark/80 backdrop-blur border border-border-dark rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-dark">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Người dùng</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Số điện thoại</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Phiên đấu</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Lượt đặt giá</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Ngày tham gia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.user_id} className="border-b border-border-dark/50 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                              {user.full_name?.charAt(0) || user.username?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{user.full_name}</p>
                              <p className="text-xs text-text-secondary">@{user.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-secondary">{user.email}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary">{user.phone_number || 'Chưa có'}</td>
                        <td className="px-6 py-4 text-sm text-white font-medium">{user.total_auctions || 0}</td>
                        <td className="px-6 py-4 text-sm text-white font-medium">{user.total_bids || 0}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary">
                          {new Date(user.created_at).toLocaleDateString('vi-VN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Fraud Tab */}
          {activeTab === 'fraud' && (
            <div className="bg-surface-dark/80 backdrop-blur border border-border-dark rounded-xl overflow-hidden">
              <div className="p-6 border-b border-border-dark">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-warning/10 border border-warning/30">
                  <span className="material-symbols-outlined text-warning text-2xl">warning</span>
                  <div>
                    <p className="text-sm font-semibold text-white">Phát hiện {fraudReports.filter(r => r.risk_level === 'Cao').length} tài khoản có nguy cơ cao</p>
                    <p className="text-xs text-text-secondary">Cần xem xét và xử lý kịp thời</p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-dark">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Người dùng</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Phiên tham gia</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Tổng đặt giá</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Giá TB</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Mức độ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fraudReports.map((report) => (
                      <tr key={report.user_id} className="border-b border-border-dark/50 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-white">{report.user_name}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-secondary">{report.email}</td>
                        <td className="px-6 py-4 text-sm text-white">{report.auctions_participated}</td>
                        <td className="px-6 py-4 text-sm text-white font-medium">{report.total_bids}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary">{formatPrice(report.avg_bid_amount || 0)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            report.risk_level === 'Cao' ? 'bg-danger/10 text-danger' :
                            report.risk_level === 'Trung bình' ? 'bg-warning/10 text-warning' :
                            'bg-success/10 text-success'
                          }`}>
                            {report.risk_level}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && statistics && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
                <div className="bg-surface-dark/80 backdrop-blur border border-border-dark rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-2xl">group</span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{statistics.statistics.total_users}</p>
                      <p className="text-sm text-text-secondary">Tổng người dùng</p>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-dark/80 backdrop-blur border border-border-dark rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="size-12 rounded-lg bg-success/10 flex items-center justify-center text-success">
                      <span className="material-symbols-outlined text-2xl">gavel</span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{statistics.statistics.total_auctions}</p>
                      <p className="text-sm text-text-secondary">Tổng phiên đấu giá</p>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-dark/80 backdrop-blur border border-border-dark rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="size-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                      <span className="material-symbols-outlined text-2xl">payments</span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{formatPrice(statistics.statistics.total_revenue || 0)}</p>
                      <p className="text-sm text-text-secondary">Tổng doanh thu</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-surface-dark/80 backdrop-blur border border-border-dark rounded-xl p-6 mb-6">
                <h3 className="text-lg font-bold text-white mb-4">Doanh thu theo tháng</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={statistics.monthlyRevenue}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#9ca3af" 
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#9ca3af" 
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      formatter={(value) => [formatPrice(value), 'Doanh thu']}//+5 giá mới!+5 giá mới!
                      labelStyle={{ color: '#9ca3af' }}
                    />
                    <Legend 
                      wrapperStyle={{ color: '#9ca3af', paddingTop: '20px' }}
                      formatter={() => 'Doanh thu (VNĐ)'}
                    />
                    <Bar 
                      dataKey="total_amount" 
                      fill="url(#colorGradient)" 
                      radius={[8, 8, 0, 0]}
                      name="Doanh thu"
                    />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-surface-dark/80 backdrop-blur border border-border-dark rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Danh mục phổ biến</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {statistics.topCategories.map((category, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-white/5">
                      <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        #{index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{category.category_name}</p>
                        <p className="text-xs text-text-secondary">{category.auction_count} phiên • {category.total_bids} lượt đặt giá</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl">
              <div className="bg-surface-dark/80 backdrop-blur border border-border-dark rounded-xl p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Cài đặt hệ thống</h3>
                  <p className="text-sm text-text-secondary mb-6">Tùy chỉnh các thông số hoạt động của nền tảng</p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white mb-1">Tự động duyệt đấu giá</p>
                    <p className="text-xs text-text-secondary">Phiên đấu giá mới sẽ được duyệt tự động không cần xét duyệt</p>
                  </div>
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, autoApprove: !prev.autoApprove }))}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      settings.autoApprove ? 'bg-success' : 'bg-white/20'
                    }`}
                  >
                    <div className={`absolute top-1 left-1 size-5 rounded-full bg-white transition-transform ${
                      settings.autoApprove ? 'translate-x-7' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white mb-1">Email thông báo</p>
                    <p className="text-xs text-text-secondary">Gửi email thông báo khi có sự kiện quan trọng</p>
                  </div>
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, emailNotifications: !prev.emailNotifications }))}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      settings.emailNotifications ? 'bg-success' : 'bg-white/20'
                    }`}
                  >
                    <div className={`absolute top-1 left-1 size-5 rounded-full bg-white transition-transform ${
                      settings.emailNotifications ? 'translate-x-7' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <div className="pt-4 border-t border-border-dark">
                  <button className="w-full px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors">
                    Lưu thay đổi
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
