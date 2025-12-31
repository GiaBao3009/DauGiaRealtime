import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import WatchlistButton from '../components/WatchlistButton';

function AuctionList() {
  const [auctions, setAuctions] = useState([]);
  const [categories, setCategories] = useState([{ category_id: 0, category_name: 'Tất cả' }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('ending_soon');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchAuctions();
  }, [searchQuery, filter, sortBy]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:3001/categories');
      const data = await response.json();
      if (data.categories) {
        setCategories([{ category_id: 0, category_name: 'Tất cả' }, ...data.categories]);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchAuctions = async () => {
    setLoading(true);
    try {
      let url = 'http://localhost:3001/auctions';
      
      // If there's a search query, use the search endpoint
      if (searchQuery) {
        url = `http://localhost:3001/search?q=${encodeURIComponent(searchQuery)}`;
        if (filter !== 'all') {
          url += `&category=${encodeURIComponent(filter)}`;
        }
      } else {
        // Otherwise use regular auction list with filters
        url += '?status=active';
        if (filter !== 'all') {
          url += `&category=${encodeURIComponent(filter)}`;
        }
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      let results = data.auctions || [];
      
      // Apply sorting
      results = sortAuctions(results, sortBy);
      
      setAuctions(results);
    } catch (err) {
      setError('Không thể tải danh sách đấu giá');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sortAuctions = (items, sortType) => {
    const sorted = [...items];
    switch(sortType) {
      case 'ending_soon':
        return sorted.sort((a, b) => new Date(a.end_time) - new Date(b.end_time));
      case 'newly_listed':
        return sorted.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
      case 'price_low':
        return sorted.sort((a, b) => a.current_price - b.current_price);
      case 'price_high':
        return sorted.sort((a, b) => b.current_price - a.current_price);
      case 'most_bids':
        return sorted.sort((a, b) => (b.total_bids || 0) - (a.total_bids || 0));
      default:
        return sorted;
    }
  };

  const getSortLabel = (sortType) => {
    const labels = {
      'ending_soon': 'Sắp kết thúc',
      'newly_listed': 'Mới nhất',
      'price_low': 'Giá thấp đến cao',
      'price_high': 'Giá cao đến thấp',
      'most_bids': 'Nhiều lượt đấu nhất'
    };
    return labels[sortType] || 'Sắp kết thúc';
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const calculateTimeLeft = (endTime) => {
    const difference = new Date(endTime) - new Date();
    if (difference > 0) {
      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return 'Đã kết thúc';
  };

  const getCategoryIcon = (categoryName) => {
    const iconMap = {
      'Tất cả': 'apps',
      'Đồng hồ': 'watch',
      'Trang sức': 'diamond',
      'Xe cộ': 'directions_car',
      'Xe máy': 'two_wheeler',
      'Ô tô': 'directions_car',
      'Điện tử': 'devices',
      'Điện thoại': 'smartphone',
      'Laptop': 'laptop',
      'Nghệ thuật': 'palette',
      'Đồ cổ': 'museum',
      'Cổ vật': 'museum',
      'Túi xách': 'shopping_bag',
      'Giày dép': 'footprint',
      'Bất động sản': 'home'
    };
    return iconMap[categoryName] || 'category';
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-dark">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-12 lg:py-16 border-b border-border-dark">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Khám phá các phiên đấu giá
              </h1>
              <p className="text-text-secondary text-lg mb-8">
                Tìm kiếm và tham gia các phiên đấu giá đang diễn ra
              </p>
              
              {/* Search Bar */}
              <div className="relative max-w-xl mx-auto">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-secondary">
                  search
                </span>
                <input 
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-12 pr-4 h-14 text-base"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-6 border-b border-border-dark">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat.category_id}
                  onClick={() => setFilter(cat.category_id === 0 ? 'all' : cat.category_name)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    (filter === 'all' && cat.category_id === 0) || (filter === cat.category_name)
                      ? 'bg-primary text-white'
                      : 'bg-surface-dark text-text-secondary hover:text-white hover:bg-surface-dark/80'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{getCategoryIcon(cat.category_name)}</span>
                  {cat.category_name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-8 lg:py-12">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {loading ? 'Đang tải...' : `${auctions.length} kết quả`}
                </h2>
                <p className="text-text-secondary text-sm">Sắp xếp theo: {getSortLabel(sortBy)}</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowFilterModal(!showFilterModal)}
                  className="btn-secondary h-10 px-4 relative"
                >
                  <span className="material-symbols-outlined text-lg">filter_list</span>
                  Bộ lọc
                  {showFilterModal && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-surface-dark border border-border-dark rounded-xl shadow-xl z-50 p-4">
                      <h3 className="text-white font-bold mb-3">Bộ lọc nâng cao</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-text-secondary text-sm mb-2 block">Danh mục</label>
                          <select 
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="input w-full"
                          >
                            {categories.map(cat => (
                              <option key={cat.category_id} value={cat.category_id === 0 ? 'all' : cat.category_name}>
                                {cat.category_name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </button>
                <button 
                  onClick={() => setShowSortModal(!showSortModal)}
                  className="btn-secondary h-10 px-4 relative"
                >
                  <span className="material-symbols-outlined text-lg">sort</span>
                  Sắp xếp
                  {showSortModal && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-surface-dark border border-border-dark rounded-xl shadow-xl z-50 py-2">
                      {[
                        { value: 'ending_soon', label: 'Sắp kết thúc' },
                        { value: 'newly_listed', label: 'Mới nhất' },
                        { value: 'price_low', label: 'Giá thấp đến cao' },
                        { value: 'price_high', label: 'Giá cao đến thấp' },
                        { value: 'most_bids', label: 'Nhiều lượt đấu nhất' }
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSortBy(option.value);
                            setShowSortModal(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                            sortBy === option.value 
                              ? 'bg-primary/10 text-primary font-medium' 
                              : 'text-text-secondary hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-20">
                <div className="text-center">
                  <div className="relative size-16 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-full border-4 border-surface-dark" />
                    <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                  </div>
                  <p className="text-text-secondary">Đang tải phiên đấu giá...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="p-6 rounded-xl bg-danger/10 border border-danger/20 text-danger flex items-center gap-3">
                <span className="material-symbols-outlined">error</span>
                {error}
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && auctions.length === 0 && (
              <div className="text-center py-20">
                <div className="size-20 mx-auto mb-6 rounded-full bg-surface-dark flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-text-secondary">gavel</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Chưa có phiên đấu giá</h3>
                <p className="text-text-secondary mb-6">Hiện tại chưa có phiên đấu giá nào đang diễn ra</p>
                <Link to="/" className="btn-primary">
                  <span className="material-symbols-outlined">home</span>
                  Về trang chủ
                </Link>
              </div>
            )}

            {/* Auction Grid */}
            {!loading && !error && auctions.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {auctions.map((auction) => (
                  <Link 
                    key={auction.auction_id} 
                    to={`/auction/${auction.auction_id}`} 
                    className="card-hover group"
                  >
                    {/* Image */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img 
                        src={auction.image_url || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?q=80&w=1000'}
                        alt={auction.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {auction.status === 'active' && new Date(auction.start_time) <= new Date() ? (
                        <div className="absolute top-3 left-3">
                          <span className="badge-live">
                            <span className="relative flex size-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                              <span className="relative inline-flex rounded-full size-2 bg-white" />
                            </span>
                            LIVE
                          </span>
                        </div>
                      ) : new Date(auction.start_time) > new Date() ? (
                        <div className="absolute top-3 left-3">
                          <span className="px-3 py-1.5 rounded-full bg-warning/90 backdrop-blur text-white text-xs font-medium flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            Đang chờ lên sàn
                          </span>
                        </div>
                      ) : null}
                      <div className="absolute top-3 right-3">
                        <WatchlistButton auctionId={auction.auction_id} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="font-bold text-white text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                        {auction.title}
                      </h3>
                      <p className="text-text-secondary text-sm line-clamp-2 mb-4">
                        {auction.description}
                      </p>

                      <div className="flex items-end justify-between mb-4">
                        <div>
                          <p className="text-xs text-text-secondary mb-1">Giá hiện tại</p>
                          <p className="text-primary font-bold text-xl">{formatPrice(auction.current_price)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-text-secondary mb-1">
                            {new Date(auction.start_time) > new Date() ? 'Bắt đầu' : 'Còn lại'}
                          </p>
                          <p className="font-mono font-medium text-white bg-surface-dark px-3 py-1.5 rounded-lg text-sm">
                            {new Date(auction.start_time) > new Date() 
                              ? calculateTimeLeft(auction.start_time)
                              : calculateTimeLeft(auction.end_time)
                            }
                          </p>
                        </div>
                      </div>
                      
                      {/* Hiển thị ngày bắt đầu nếu chưa diễn ra */}
                      {new Date(auction.start_time) > new Date() && (
                        <div className="mb-3 p-2 rounded-lg bg-warning/10 border border-warning/20 text-warning text-xs text-center">
                          Lên sàn: {new Date(auction.start_time).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm text-text-secondary mb-4">
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-base">person</span>
                          {auction.total_bids || 0} lượt đặt
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-base">visibility</span>
                          {auction.views || 0}
                        </span>
                      </div>

                      <button className="btn-primary w-full h-11">
                        <span className="material-symbols-outlined text-lg">gavel</span>
                        Đặt giá ngay
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && auctions.length > 0 && (
              <div className="flex justify-center mt-12">
                <div className="flex items-center gap-2">
                  <button className="size-10 rounded-lg bg-surface-dark text-text-secondary hover:text-white hover:bg-primary transition-all flex items-center justify-center">
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button className="size-10 rounded-lg bg-primary text-white flex items-center justify-center">1</button>
                  <button className="size-10 rounded-lg bg-surface-dark text-text-secondary hover:text-white hover:bg-primary transition-all flex items-center justify-center">2</button>
                  <button className="size-10 rounded-lg bg-surface-dark text-text-secondary hover:text-white hover:bg-primary transition-all flex items-center justify-center">3</button>
                  <button className="size-10 rounded-lg bg-surface-dark text-text-secondary hover:text-white hover:bg-primary transition-all flex items-center justify-center">
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default AuctionList;