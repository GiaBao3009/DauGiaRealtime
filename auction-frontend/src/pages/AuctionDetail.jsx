import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import WatchlistButton from '../components/WatchlistButton';

function AuctionDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ hours: '00', minutes: '00', seconds: '00' });
  const [bidSuccess, setBidSuccess] = useState(false);

  useEffect(() => {
    fetchAuctionDetail();
    
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.emit('join_auction', id);

    newSocket.on('receive_bid', (data) => {
      setBids(prev => [data, ...prev]);
      setAuction(prev => ({
        ...prev,
        current_price: data.amount,
        total_bids: (prev.total_bids || 0) + 1
      }));
    });

    return () => {
      newSocket.disconnect();
    };
  }, [id]);

  useEffect(() => {
    if (!auction) return;
    
    const timer = setInterval(() => {
      const now = new Date();
      const startTime = new Date(auction.start_time);
      const endTime = new Date(auction.end_time);
      
      // Nếu CHƯA bắt đầu → đếm ngược đến start_time
      if (now < startTime) {
        const difference = startTime - now;
        const hours = String(Math.floor(difference / (1000 * 60 * 60))).padStart(2, '0');
        const minutes = String(Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
        const seconds = String(Math.floor((difference % (1000 * 60)) / 1000)).padStart(2, '0');
        setTimeLeft({ hours, minutes, seconds, status: 'waiting' });
      } 
      // Nếu đang diễn ra → đếm ngược đến end_time
      else if (now >= startTime && now < endTime) {
        const difference = endTime - now;
        const hours = String(Math.floor(difference / (1000 * 60 * 60))).padStart(2, '0');
        const minutes = String(Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
        const seconds = String(Math.floor((difference % (1000 * 60)) / 1000)).padStart(2, '0');
        setTimeLeft({ hours, minutes, seconds, status: 'active' });
      }
      // Nếu đã kết thúc
      else {
        setTimeLeft({ hours: '00', minutes: '00', seconds: '00', status: 'ended' });
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [auction]);

  const fetchAuctionDetail = async () => {
    try {
      const response = await fetch(`http://localhost:3001/auctions/${id}`);
      const data = await response.json();
      console.log('Fetched auction data:', data.auction); // Debug
      console.log('View count:', data.auction.view_count); // Debug
      setAuction(data.auction);
      setBids(data.bids || []);
      setBidAmount(data.auction.current_price + 100000);
    } catch (err) {
      setError('Không thể tải thông tin đấu giá');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Vui lòng đăng nhập để đặt giá!');
      return;
    }

    // KHÔNG CHO TỰ ĐẤU GIÁ VỚI CHÍNH MÌNH
    if (auction.highest_bidder_id === user.user_id) {
      alert('Bạn đang là người đặt giá cao nhất! Không thể tự vượt giá chính mình.');
      return;
    }

    const numBidAmount = parseFloat(bidAmount);
    
    // Bước nhảy dựa trên GIÁ KHỞI ĐIỂM, không phải giá hiện tại
    const minBidIncrement = auction.starting_price * 0.01; // 1% giá khởi điểm
    const maxBidIncrement = auction.starting_price * 0.10; // 10% giá khởi điểm
    const minRequiredBid = auction.current_price + minBidIncrement;
    const maxAllowedBid = auction.current_price + maxBidIncrement;
    
    if (numBidAmount < minRequiredBid) {
      alert(`Giá đặt phải tối thiểu ${formatPrice(minRequiredBid)} (tăng ít nhất ${formatPrice(minBidIncrement)} - 1% giá khởi điểm)`);
      return;
    }
    
    if (numBidAmount > maxAllowedBid) {
      alert(`Giá đặt không được vượt quá ${formatPrice(maxAllowedBid)} (tăng tối đa ${formatPrice(maxBidIncrement)} - 10% giá khởi điểm)`);
      return;
    }

    try {
      // Call API to save bid to database
      const response = await fetch('http://localhost:3001/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auction_id: id,
          bidder_id: user.user_id,
          bid_amount: numBidAmount
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Bid error:', data);
        alert(data.message || 'Không thể đặt giá');
        return;
      }

      // Emit socket event for real-time update
      const bidData = {
        auction_id: id,
        user_id: user.user_id,
        username: user.full_name || user.username,
        amount: numBidAmount,
        bid_time: new Date()
      };

      socket.emit('send_bid', bidData);
      
      setBidSuccess(true);
      setTimeout(() => setBidSuccess(false), 3000);
      setBidAmount(numBidAmount + 100000);
      
      // Refresh auction detail
      fetchAuctionDetail();
    } catch (err) {
      console.error('Error placing bid:', err);
      alert('Có lỗi xảy ra khi đặt giá');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <div className="relative size-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-surface-dark" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-text-secondary">Đang tải phiên đấu giá...</p>
        </div>
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <div className="size-20 mx-auto mb-6 rounded-full bg-danger/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-danger">error</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Không tìm thấy</h3>
          <p className="text-text-secondary mb-6">{error || 'Phiên đấu giá không tồn tại hoặc đã kết thúc'}</p>
          <Link to="/auctions" className="btn-primary">
            <span className="material-symbols-outlined">arrow_back</span>
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background-dark">
      <Header />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="border-b border-border-dark">
          <div className="mx-auto max-w-7xl px-4 lg:px-8 py-4">
            <div className="flex items-center gap-2 text-sm">
              <Link to="/" className="text-text-secondary hover:text-white transition-colors">Trang chủ</Link>
              <span className="material-symbols-outlined text-text-secondary text-sm">chevron_right</span>
              <Link to="/auctions" className="text-text-secondary hover:text-white transition-colors">Đấu giá</Link>
              <span className="material-symbols-outlined text-text-secondary text-sm">chevron_right</span>
              <span className="text-white font-medium">{auction.title}</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column - Image & Description */}
            <div className="lg:col-span-7 space-y-6">
              {/* Image Gallery */}
              <div className="card p-0 overflow-hidden">
                <div className="relative aspect-[4/3]">
                  <img 
                    src={auction.image_url || 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=1000'}
                    alt={auction.title}
                    className="w-full h-full object-cover"
                  />
                  {auction.status === 'active' && (
                    <div className="absolute top-4 left-4">
                      <span className="badge-live">
                        <span className="relative flex size-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                          <span className="relative inline-flex rounded-full size-2 bg-white" />
                        </span>
                        ĐANG DIỄN RA
                      </span>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 flex gap-2">
                    {user && user.role_id === 1 && (
                      <Link 
                        to={`/edit-auction/${auction.auction_id}`}
                        className="size-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-primary transition-colors"
                        title="Chỉ Admin mới có quyền chỉnh sửa"
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </Link>
                    )}
                    <WatchlistButton auctionId={auction.auction_id} size="lg" />
                    <button className="size-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-primary transition-colors">
                      <span className="material-symbols-outlined">share</span>
                    </button>
                  </div>
                  <div className="absolute bottom-4 left-4 flex items-center gap-3 text-white">
                    <div className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur flex items-center gap-2 text-sm">
                      <span className="material-symbols-outlined text-lg">visibility</span>
                      <span className="font-medium">{auction.view_count || 0}</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur flex items-center gap-2 text-sm">
                      <span className="material-symbols-outlined text-lg">gavel</span>
                      <span className="font-medium">{auction.total_bids || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Info Card */}
              <div className="card">
                <h2 className="text-xl font-bold text-white mb-4">Thông tin sản phẩm</h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-text-secondary leading-relaxed">{auction.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border-dark">
                  <div>
                    <p className="text-text-secondary text-sm mb-1">Người bán</p>
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm text-primary">person</span>
                      </div>
                      <span className="text-white font-medium">{auction.seller_name || 'Ẩn danh'}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-text-secondary text-sm mb-1">Giá khởi điểm</p>
                    <p className="text-white font-bold text-lg">{formatPrice(auction.starting_price)}</p>
                  </div>
                  <div>
                    <p className="text-text-secondary text-sm mb-1">Thời gian bắt đầu</p>
                    <p className="text-white">{new Date(auction.start_time).toLocaleString('vi-VN')}</p>
                  </div>
                  <div>
                    <p className="text-text-secondary text-sm mb-1">Thời gian kết thúc</p>
                    <p className="text-white">{new Date(auction.end_time).toLocaleString('vi-VN')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Bidding */}
            <div className="lg:col-span-5">
              <div className="sticky top-24 space-y-6">
                {/* Title */}
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">{auction.title}</h1>
                  <div className="flex items-center gap-3 text-sm text-text-secondary">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">visibility</span>
                      {auction.view_count || 0} lượt xem
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">gavel</span>
                      {auction.total_bids || 0} lượt đặt giá
                    </span>
                  </div>
                </div>

                {/* Countdown Timer */}
                <div className="card bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white font-medium flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">timer</span>
                      {timeLeft.status === 'waiting' ? 'Đang chờ lên sàn' : 'Thời gian còn lại'}
                    </span>
                    {timeLeft.status === 'active' && (
                      <span className="badge-live text-xs">LIVE</span>
                    )}
                    {timeLeft.status === 'waiting' && (
                      <span className="px-2 py-1 rounded-full bg-warning/20 text-warning text-xs font-medium">
                        Chưa bắt đầu
                      </span>
                    )}
                  </div>
                  
                  {/* Hiển thị ngày bắt đầu nếu chưa diễn ra */}
                  {timeLeft.status === 'waiting' && (
                    <div className="mb-3 p-3 rounded-lg bg-warning/10 border border-warning/20 text-warning text-sm">
                      <p className="font-medium">
                        Phiên đấu giá sẽ bắt đầu vào: {new Date(auction.start_time).toLocaleString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex justify-center gap-4">
                    {[
                      { value: timeLeft.hours, label: 'Giờ' },
                      { value: timeLeft.minutes, label: 'Phút' },
                      { value: timeLeft.seconds, label: 'Giây' }
                    ].map((item, i) => (
                      <div key={i} className="text-center">
                        <div className="bg-surface-dark rounded-xl px-4 py-3 min-w-[70px]">
                          <span className="text-3xl font-mono font-bold text-white">{item.value}</span>
                        </div>
                        <span className="text-xs text-text-secondary mt-1 block">{item.label}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Hiển thị khoảng thời gian */}
                  {timeLeft.status === 'active' && (
                    <div className="mt-3 text-center text-xs text-text-secondary">
                      Từ {new Date(auction.start_time).toLocaleDateString('vi-VN')} đến {new Date(auction.end_time).toLocaleDateString('vi-VN')}
                    </div>
                  )}
                </div>

                {/* Current Price */}
                <div className="card">
                  <p className="text-text-secondary text-sm mb-2">Giá hiện tại</p>
                  <p className="text-4xl font-bold text-primary mb-1">{formatPrice(auction.current_price)}</p>
                  <p className="text-text-secondary text-sm">
                    Bước giá tối thiểu: <span className="text-white">100,000 ₫</span>
                  </p>
                </div>

                {/* Bid Form */}
                <div className="card">
                  {bidSuccess && (
                    <div className="mb-4 p-3 rounded-lg bg-success/10 border border-success/20 text-success text-sm flex items-center gap-2">
                      <span className="material-symbols-outlined">check_circle</span>
                      Đặt giá thành công!
                    </div>
                  )}
                  
                  {/* Badge đang dẫn đầu */}
                  {user && auction.highest_bidder_id === user.user_id && (
                    <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm flex items-center gap-2">
                      <span className="material-symbols-outlined">emoji_events</span>
                      Bạn đang dẫn đầu! Không thể tự vượt giá chính mình.
                    </div>
                  )}
                  
                  <form onSubmit={handlePlaceBid} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-white mb-2 block">Nhập giá của bạn</label>
                      <div className="relative">
                        <input 
                          className="input pl-4 pr-12 h-14 text-xl font-bold" 
                          placeholder="0"
                          type="number"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          disabled={timeLeft.status === 'waiting'}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary font-medium">₫</span>
                      </div>
                    </div>
                    
                    {/* Quick Bid Buttons */}
                    <div className="flex gap-2">
                      {[
                        { percent: 0.01, label: '+1%' },
                        { percent: 0.05, label: '+5%' },
                        { percent: 0.10, label: '+10%' }
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setBidAmount(Number(bidAmount || auction.current_price) + (auction.starting_price * item.percent))}
                          disabled={timeLeft.status === 'waiting'}
                          className="flex-1 py-2 rounded-lg bg-surface-dark text-text-secondary hover:text-white hover:bg-primary/20 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <button 
                      type="submit"
                      disabled={!user || auction.status?.toUpperCase() !== 'ACTIVE' || timeLeft.status === 'waiting'}
                      className="btn-primary w-full h-14 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined">gavel</span>
                      {!user ? 'Đăng nhập để đặt giá' : 
                       timeLeft.status === 'waiting' ? 'Chưa thể đặt giá' : 
                       'Đặt giá ngay'}
                    </button>
                  </form>
                  
                  {timeLeft.status === 'waiting' && (
                    <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/20 text-warning text-sm text-center">
                      <span className="material-symbols-outlined text-base align-middle">info</span>
                      Phiên đấu giá chưa bắt đầu. Vui lòng quay lại sau.
                    </div>
                  )}
                  
                  {!user && (
                    <p className="text-center text-text-secondary text-sm mt-4">
                      <Link to="/login" className="text-primary hover:underline">Đăng nhập</Link> để tham gia đấu giá
                    </p>
                  )}
                </div>

                {/* Bid History */}
                <div className="card p-0">
                  <div className="p-4 border-b border-border-dark flex items-center justify-between">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">history</span>
                      Lịch sử đấu giá
                    </h3>
                    <span className="badge">{bids.length} lượt</span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {bids.length === 0 ? (
                      <div className="p-8 text-center">
                        <span className="material-symbols-outlined text-4xl text-text-secondary mb-2">hourglass_empty</span>
                        <p className="text-text-secondary">Chưa có ai đặt giá</p>
                      </div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {bids.map((bid, index) => (
                          <div 
                            key={bid.bid_id || index} 
                            className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                              index === 0 
                                ? 'bg-primary/10 border border-primary/20' 
                                : 'hover:bg-surface-dark'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`size-8 rounded-full flex items-center justify-center ${
                                index === 0 ? 'bg-primary text-white' : 'bg-surface-dark text-text-secondary'
                              }`}>
                                {index === 0 ? (
                                  <span className="material-symbols-outlined text-sm">emoji_events</span>
                                ) : (
                                  <span className="text-sm font-bold">{index + 1}</span>
                                )}
                              </div>
                              <span className="text-white font-medium">
                                {bid.bidder_name || bid.username || 'Người dùng ẩn danh'}
                              </span>
                            </div>
                            <span className={`font-bold ${index === 0 ? 'text-primary' : 'text-white'}`}>
                              {formatPrice(bid.bid_amount || bid.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AuctionDetail;