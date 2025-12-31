import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

function Watchlist() {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWatchlist();
    }
  }, [user]);

  const fetchWatchlist = async () => {
    try {
      const response = await fetch(`http://localhost:3001/user/${user.user_id}/watchlist`);
      const data = await response.json();
      
      if (data.success) {
        setWatchlist(data.watchlist || []);
      }
    } catch (err) {
      console.error('Error fetching watchlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatchlist = async (auctionId) => {
    try {
      const response = await fetch(`http://localhost:3001/user/${user.user_id}/watchlist/${auctionId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setWatchlist(watchlist.filter(item => item.auction_id !== auctionId));
      }
    } catch (err) {
      console.error('Error removing from watchlist:', err);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const getTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    
    if (diff <= 0) return 'Đã kết thúc';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background-dark">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
            <p className="text-text-secondary">Đang tải...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background-dark">
      <Header />
      
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Danh sách theo dõi</h1>
            <p className="text-text-secondary">Các phiên đấu giá bạn đang quan tâm</p>
          </div>

          {/* Content */}
          {watchlist.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center size-20 rounded-full bg-surface-dark mb-4">
                <span className="material-symbols-outlined text-4xl text-text-muted">bookmark</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Chưa có sản phẩm nào</h3>
              <p className="text-text-secondary mb-6">Nhấn vào icon trái tim để thêm phiên đấu giá vào danh sách theo dõi</p>
              <Link to="/auctions" className="btn-primary">
                Khám phá phiên đấu giá
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {watchlist.map((item) => (
                <div key={item.auction_id} className="group card-hover overflow-hidden relative">
                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      removeFromWatchlist(item.auction_id);
                    }}
                    className="absolute top-2 right-2 z-10 size-10 rounded-full bg-danger/90 backdrop-blur-sm flex items-center justify-center text-white hover:bg-danger transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">close</span>
                  </button>

                  <Link to={`/auction/${item.auction_id}`}>
                    {/* Image */}
                    <div className="relative aspect-[4/3] -m-6 mb-4 overflow-hidden">
                      <img
                        src={item.image_url}
                        alt={item.product_name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/600x400?text=No+Image'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card-dark via-transparent to-transparent" />
                      
                      {item.status === 'ACTIVE' && (
                        <div className="absolute top-4 left-4 badge-live">
                          <span className="size-2 rounded-full bg-white animate-pulse" />
                          LIVE
                        </div>
                      )}

                      <div className="absolute bottom-4 right-4 bg-surface-dark/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm font-mono font-medium text-white">
                        {getTimeRemaining(item.end_time)}
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-bold text-white mb-3 group-hover:text-primary transition-colors line-clamp-1">
                      {item.product_name}
                    </h3>

                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs text-text-secondary mb-1">Giá hiện tại</p>
                        <p className="text-xl font-bold text-primary">{formatPrice(item.current_price)}đ</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-text-secondary mb-1">{item.total_bids || 0} lượt đấu</p>
                        <button className="btn-primary py-2 px-4 text-sm">
                          Đặt giá
                        </button>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Watchlist;
