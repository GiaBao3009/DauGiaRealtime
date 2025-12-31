import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

function MyBids() {
  const { user } = useAuth();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyBids();
    }
  }, [user]);

  const fetchMyBids = async () => {
    try {
      // Lấy danh sách auctions mà user đã bid
      const response = await fetch(`http://localhost:3001/user/${user.user_id}/bids`);
      const data = await response.json();
      
      if (data.success) {
        // Group bids by auction_id và lấy auction info
        const auctionIds = [...new Set(data.bids.map(bid => bid.auction_id))];
        const auctionPromises = auctionIds.map(id => 
          fetch(`http://localhost:3001/auctions/${id}`).then(res => res.json())
        );
        
        const auctionsData = await Promise.all(auctionPromises);
        const activeAuctions = auctionsData
          .filter(a => a.auction && a.auction.status === 'ACTIVE')
          .map(a => a.auction);
        
        setAuctions(activeAuctions);
      }
    } catch (err) {
      console.error('Error fetching my bids:', err);
    } finally {
      setLoading(false);
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
            <h1 className="text-3xl font-bold text-white mb-2">Đang đấu giá</h1>
            <p className="text-text-secondary">Các phiên đấu giá mà bạn đang tham gia</p>
          </div>

          {/* Content */}
          {auctions.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center size-20 rounded-full bg-surface-dark mb-4">
                <span className="material-symbols-outlined text-4xl text-text-muted">gavel</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Chưa có phiên đấu giá nào</h3>
              <p className="text-text-secondary mb-6">Bạn chưa tham gia đấu giá phiên nào</p>
              <Link to="/auctions" className="btn-primary">
                Khám phá phiên đấu giá
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {auctions.map((auction) => (
                <Link
                  key={auction.auction_id}
                  to={`/auction/${auction.auction_id}`}
                  className="group card-hover overflow-hidden"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] -m-6 mb-4 overflow-hidden">
                    <img
                      src={auction.image_url}
                      alt={auction.product_name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/600x400?text=No+Image'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card-dark via-transparent to-transparent" />
                    
                    <div className="absolute top-4 left-4 badge-live">
                      <span className="size-2 rounded-full bg-white animate-pulse" />
                      ĐANG THAM GIA
                    </div>

                    <div className="absolute bottom-4 right-4 bg-surface-dark/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm font-mono font-medium text-white">
                      {getTimeRemaining(auction.end_time)}
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-bold text-white mb-3 group-hover:text-primary transition-colors line-clamp-1">
                    {auction.product_name}
                  </h3>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-text-secondary mb-1">Giá hiện tại</p>
                      <p className="text-xl font-bold text-primary">{formatPrice(auction.current_price)}đ</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-text-secondary mb-1">{auction.total_bids || 0} lượt đấu</p>
                      <button className="btn-primary py-2 px-4 text-sm">
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default MyBids;
