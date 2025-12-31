import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

function BidHistory() {
  const { user } = useAuth();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, won, lost, active

  useEffect(() => {
    fetchBidHistory();
  }, [user]);

  const fetchBidHistory = async () => {
    try {
      const response = await fetch(`http://localhost:3001/bids/user/${user.user_id}`);
      const data = await response.json();
      setBids(data.bids || []);
    } catch (err) {
      console.error('Error fetching bid history:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBids = bids.filter(bid => {
    if (filter === 'all') return true;
    if (filter === 'won') return bid.status === 'COMPLETED' && bid.is_highest_bidder;
    if (filter === 'lost') return bid.status === 'COMPLETED' && !bid.is_highest_bidder;
    if (filter === 'active') return bid.status === 'ACTIVE';
    return true;
  });

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background-dark">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Lịch sử đấu giá</h1>
          <p className="text-text-secondary">Tất cả các lần đấu giá của bạn</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: 'all', label: 'Tất cả', icon: 'list' },
            { key: 'active', label: 'Đang diễn ra', icon: 'timer' },
            { key: 'won', label: 'Đã thắng', icon: 'emoji_events' },
            { key: 'lost', label: 'Đã thua', icon: 'cancel' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                filter === tab.key
                  ? 'bg-primary text-white'
                  : 'bg-surface-dark text-text-secondary hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              {tab.label}
              {tab.key === 'all' && bids.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs">
                  {bids.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">Đang tải lịch sử...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredBids.length === 0 && (
          <div className="card text-center py-16">
            <span className="material-symbols-outlined text-6xl text-text-secondary mb-4 block">history</span>
            <h3 className="text-xl font-bold text-white mb-2">Chưa có lịch sử đấu giá</h3>
            <p className="text-text-secondary mb-6">Bạn chưa tham gia phiên đấu giá nào</p>
            <Link to="/auctions" className="btn-primary inline-block">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined">gavel</span>
                Khám phá phiên đấu giá
              </span>
            </Link>
          </div>
        )}

        {/* Bid History List */}
        {!loading && filteredBids.length > 0 && (
          <div className="space-y-4">
            {filteredBids.map((bid) => (
              <div key={bid.bid_id} className="card hover:border-primary/30 transition-colors">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Auction Image */}
                  <Link to={`/auction/${bid.auction_id}`} className="shrink-0">
                    <img
                      src={bid.image_url || '/placeholder.jpg'}
                      alt={bid.product_name}
                      className="w-full md:w-40 h-40 object-cover rounded-lg"
                    />
                  </Link>

                  {/* Bid Info */}
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`/auction/${bid.auction_id}`}
                      className="text-xl font-bold text-white hover:text-primary transition-colors line-clamp-1"
                    >
                      {bid.product_name}
                    </Link>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        bid.status === 'ACTIVE' ? 'bg-success/20 text-success' :
                        bid.status === 'COMPLETED' ? 'bg-gray-500/20 text-gray-300' :
                        'bg-danger/20 text-danger'
                      }`}>
                        {bid.status === 'ACTIVE' ? 'Đang diễn ra' : 
                         bid.status === 'COMPLETED' ? 'Đã kết thúc' : 'Đã hủy'}
                      </span>
                      
                      {bid.is_highest_bidder && bid.status === 'ACTIVE' && (
                        <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
                          🔥 Đang dẫn đầu
                        </span>
                      )}
                      
                      {bid.is_highest_bidder && bid.status === 'COMPLETED' && (
                        <span className="px-3 py-1 rounded-full bg-success/20 text-success text-xs font-medium">
                          🏆 Đã thắng
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                      <div>
                        <p className="text-text-secondary text-sm">Giá đấu của bạn</p>
                        <p className="text-white font-bold text-lg">{formatVND(bid.bid_amount)}</p>
                      </div>
                      <div>
                        <p className="text-text-secondary text-sm">Giá hiện tại</p>
                        <p className="text-primary font-bold text-lg">{formatVND(bid.current_price)}</p>
                      </div>
                      <div>
                        <p className="text-text-secondary text-sm">Thời gian đấu</p>
                        <p className="text-white text-sm">
                          {new Date(bid.bid_time).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <Link 
                      to={`/auction/${bid.auction_id}`}
                      className="btn-primary whitespace-nowrap"
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined">visibility</span>
                        Xem chi tiết
                      </span>
                    </Link>
                    
                    {bid.status === 'ACTIVE' && !bid.is_highest_bidder && (
                      <Link
                        to={`/auction/${bid.auction_id}`}
                        className="btn-secondary whitespace-nowrap"
                      >
                        <span className="flex items-center gap-2">
                          <span className="material-symbols-outlined">gavel</span>
                          Đấu giá lại
                        </span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Statistics Summary */}
        {!loading && bids.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <div className="card text-center">
              <span className="material-symbols-outlined text-4xl text-primary mb-2">gavel</span>
              <p className="text-3xl font-bold text-white">{bids.length}</p>
              <p className="text-text-secondary text-sm">Tổng số lần đấu</p>
            </div>
            
            <div className="card text-center">
              <span className="material-symbols-outlined text-4xl text-success mb-2">emoji_events</span>
              <p className="text-3xl font-bold text-white">
                {bids.filter(b => b.status === 'COMPLETED' && b.is_highest_bidder).length}
              </p>
              <p className="text-text-secondary text-sm">Đã thắng</p>
            </div>
            
            <div className="card text-center">
              <span className="material-symbols-outlined text-4xl text-warning mb-2">timer</span>
              <p className="text-3xl font-bold text-white">
                {bids.filter(b => b.status === 'ACTIVE').length}
              </p>
              <p className="text-text-secondary text-sm">Đang tham gia</p>
            </div>
            
            <div className="card text-center">
              <span className="material-symbols-outlined text-4xl text-text-secondary mb-2">trending_up</span>
              <p className="text-3xl font-bold text-white">
                {bids.filter(b => b.is_highest_bidder && b.status === 'ACTIVE').length}
              </p>
              <p className="text-text-secondary text-sm">Đang dẫn đầu</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default BidHistory;
