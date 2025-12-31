import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import WatchlistButton from '../components/WatchlistButton';

function Home() {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, status: 'waiting' });
  const [featuredAuctions, setFeaturedAuctions] = useState([]);
  const [heroAuction, setHeroAuction] = useState(null);
  const [stats, setStats] = useState({
    onlineUsers: 0,
    soldProducts: 0,
    totalTransactions: 0
  });

  // Load stats from API
  useEffect(() => {
    fetch('http://localhost:3001/stats')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      })
      .catch(err => console.error('Error loading stats:', err));
  }, []);

  // Load auctions from API
  useEffect(() => {
    fetch('http://localhost:3001/auctions?status=active&limit=6')
      .then(res => res.json())
      .then(data => {
        console.log('Fetched auctions:', data); // Debug
        if (data.auctions && data.auctions.length > 0) {
          setFeaturedAuctions(data.auctions.slice(0, 3));
          setHeroAuction(data.auctions[0]);
        } else {
          console.warn('No auctions found');
        }
      })
      .catch(err => console.error('Error loading auctions:', err));
  }, []);

  // Countdown timer based on heroAuction
  useEffect(() => {
    if (!heroAuction) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const startTime = new Date(heroAuction.start_time);
      const endTime = new Date(heroAuction.end_time);

      // Chưa bắt đầu - countdown đến start_time
      if (now < startTime) {
        const difference = startTime - now;
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds, status: 'waiting' });
      }
      // Đang diễn ra - countdown đến end_time
      else if (now >= startTime && now < endTime) {
        const difference = endTime - now;
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds, status: 'active' });
      }
      // Đã kết thúc
      else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, status: 'ended' });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [heroAuction]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const statsDisplay = [
    { 
      icon: 'group', 
      label: 'Người dùng online', 
      value: new Intl.NumberFormat('vi-VN').format(stats.onlineUsers || 0), 
      color: 'text-success' 
    },
    { 
      icon: 'shopping_bag', 
      label: 'Sản phẩm đã bán', 
      value: new Intl.NumberFormat('vi-VN').format(stats.soldProducts || 0) + '+', 
      color: 'text-primary' 
    },
    { 
      icon: 'payments', 
      label: 'Tổng giao dịch', 
      value: `${((stats.totalTransactions || 0) / 1000000000).toFixed(1)} Tỷ`, 
      color: 'text-warning' 
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background-dark to-background-dark" />
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent" />
          
          <div className="relative mx-auto max-w-7xl px-4 lg:px-8 py-12 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Left Content */}
              <div className="order-2 lg:order-1">
                <div className="flex items-center gap-2 mb-6">
                  <span className="badge-live">
                    <span className="material-symbols-outlined text-sm">live_tv</span>
                    LIVE
                  </span>
                  <span className="badge bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-sm">verified</span>
                    Auction of the Day
                  </span>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
                  <span className="text-gradient">{heroAuction ? heroAuction.title || heroAuction.product_name : 'Đang tải...'}</span>
                </h1>

                <p className="text-text-secondary text-lg leading-relaxed mb-8 max-w-lg">
                  {heroAuction ? (heroAuction.description?.length > 150 ? heroAuction.description.substring(0, 150) + '...' : heroAuction.description) : 'Đang tải thông tin...'}
                </p>

                {/* Price & Timer */}
                <div className="grid grid-cols-2 gap-4 p-6 rounded-2xl bg-surface-dark/50 border border-border-dark backdrop-blur-sm mb-8">
                  <div>
                    <p className="text-text-secondary text-sm font-medium mb-1">Giá hiện tại</p>
                    <p className="text-3xl font-extrabold text-primary">{heroAuction ? formatPrice(heroAuction.current_price) + 'đ' : '...'}</p>
                    <p className="text-xs text-text-muted">VND</p>
                  </div>
                  <div>
                    <p className="text-text-secondary text-sm font-medium mb-1">
                      {timeLeft.status === 'waiting' ? 'Bắt đầu sau' : timeLeft.status === 'ended' ? 'Đã kết thúc' : 'Kết thúc sau'}
                    </p>
                    <div className="flex items-center gap-1 text-3xl font-bold font-mono text-white">
                      <span className="bg-surface-highlight px-2 py-1 rounded">
                        {String(timeLeft.hours).padStart(2, '0')}
                      </span>
                      <span className="text-text-muted">:</span>
                      <span className="bg-surface-highlight px-2 py-1 rounded">
                        {String(timeLeft.minutes).padStart(2, '0')}
                      </span>
                      <span className="text-text-muted">:</span>
                      <span className="bg-surface-highlight px-2 py-1 rounded text-red-400">
                        {String(timeLeft.seconds).padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to={heroAuction ? `/auction/${heroAuction.auction_id}` : '/auctions'} className="btn-primary h-14 px-8 text-base">
                    <span className="material-symbols-outlined">gavel</span>
                    Đặt Giá Ngay
                  </Link>
                  <Link to={heroAuction ? `/auction/${heroAuction.auction_id}` : '/auctions'} className="btn-secondary h-14 px-8 text-base">
                    <span className="material-symbols-outlined">visibility</span>
                    Xem chi tiết
                  </Link>
                </div>
              </div>

              {/* Right Image */}
              <div className="order-1 lg:order-2 relative">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl shadow-primary/10">
                  <img
                    src={heroAuction?.image_url || 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=1000'}
                    alt={heroAuction?.product_name || 'Sản phẩm đấu giá'}
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background-dark/80 via-transparent to-transparent" />
                  
                  {/* Stats overlay */}
                  {heroAuction && (
                    <div className="absolute bottom-4 left-4 right-4 flex gap-4">
                      <div className="flex-1 glass rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-white">{heroAuction.total_bids || 0}</p>
                        <p className="text-xs text-text-secondary">Lượt đấu</p>
                      </div>
                      <div className="flex-1 glass rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-white">{heroAuction.view_count || 0}</p>
                        <p className="text-xs text-text-secondary">Người xem</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Floating elements */}
                {heroAuction && heroAuction.total_bids > 0 && (
                  <div className="absolute -top-4 -right-4 bg-success text-white rounded-full px-4 py-2 text-sm font-bold shadow-lg animate-bounce-slow">
                    +{heroAuction.total_bids} giá mới!
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-y border-border-dark bg-surface-dark/30">
          <div className="mx-auto max-w-7xl px-4 lg:px-8 py-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {statsDisplay.map((stat) => (
                <div key={stat.label} className="flex items-center gap-4 p-4 rounded-xl bg-surface-dark/50 border border-border-dark">
                  <div className={`flex size-12 items-center justify-center rounded-xl bg-current/10 ${stat.color}`}>
                    <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm text-text-secondary">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Auctions */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Đang đấu giá</h2>
                <p className="text-text-secondary">Các phiên đấu giá hot nhất đang diễn ra</p>
              </div>
              <Link to="/auctions" className="btn-ghost hidden sm:flex">
                Xem tất cả
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredAuctions.length > 0 ? featuredAuctions.map((auction) => (
                <Link
                  key={auction.auction_id}
                  to={`/auction/${auction.auction_id}`}
                  className="group card-hover overflow-hidden"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] -m-6 mb-4 overflow-hidden">
                    <img
                      src={auction.image_url || 'https://via.placeholder.com/600x400?text=No+Image'}
                      alt={auction.title || auction.product_name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/600x400?text=No+Image'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card-dark via-transparent to-transparent" />
                    
                    {auction.status === 'active' && new Date(auction.start_time) <= new Date() ? (
                      <div className="absolute top-4 left-4 badge-live">
                        <span className="size-2 rounded-full bg-white animate-pulse" />
                        LIVE
                      </div>
                    ) : new Date(auction.start_time) > new Date() ? (
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1.5 rounded-full bg-warning/90 backdrop-blur text-white text-xs font-medium flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">schedule</span>
                          Đang chờ lên sàn
                        </span>
                      </div>
                    ) : null}

                    <div className="absolute bottom-4 right-4 bg-surface-dark/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm font-mono font-medium text-white">
                      Đang diễn ra
                    </div>
                    <div className="absolute top-4 right-4">
                      <WatchlistButton auctionId={auction.auction_id} />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-bold text-white mb-3 group-hover:text-primary transition-colors line-clamp-1">
                    {auction.title || auction.product_name}
                  </h3>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-text-secondary mb-1">Giá hiện tại</p>
                      <p className="text-xl font-bold text-primary">{formatPrice(auction.current_price)}đ</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-text-secondary mb-1">{auction.total_bids || 0} lượt đấu</p>
                      <button className="btn-primary py-2 px-4 text-sm">
                        Đặt giá
                      </button>
                    </div>
                  </div>
                </Link>
              )) : (
                <div className="col-span-full text-center py-12 text-text-secondary">
                  <span className="material-symbols-outlined text-6xl mb-4 opacity-30">hourglass_empty</span>
                  <p className="text-lg">Chưa có phiên đấu giá nào đang diễn ra</p>
                </div>
              )}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link to="/auctions" className="btn-secondary">
                Xem tất cả phiên đấu giá
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 lg:py-24 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-y border-border-dark">
          <div className="mx-auto max-w-7xl px-4 lg:px-8 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Bạn có sản phẩm muốn đấu giá?
            </h2>
            <p className="text-text-secondary text-lg mb-8 max-w-2xl mx-auto">
              Đăng ký bán hàng ngay hôm nay để tiếp cận hàng ngàn người mua tiềm năng
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/create-auction" className="btn-primary h-14 px-8 text-base">
                <span className="material-symbols-outlined">add_business</span>
                Đăng ký bán hàng
              </Link>
              <Link to="/auctions" className="btn-secondary h-14 px-8 text-base">
                Tìm hiểu thêm
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Home;
