import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

function MyAuctions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMyAuctions();
    }
  }, [user, filterStatus]);

  const fetchMyAuctions = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3001/user/${user.user_id}/selling-auctions?status=${filterStatus}`
      );
      const data = await response.json();
      if (data.success) {
        setAuctions(data.auctions);
      }
    } catch (err) {
      console.error('Error fetching auctions:', err);
    } finally {
      setLoading(false);
    }
  };

  const showWinnerDetails = async (auction) => {
    if (auction.status !== 'COMPLETED' || !auction.highest_bidder_id) {
      alert('Phiên đấu giá chưa kết thúc hoặc không có người thắng');
      return;
    }
    setSelectedAuction(auction);
    setShowWinnerModal(true);
  };

  const completeTransaction = async (auctionId) => {
    if (!confirm('Xác nhận đã hoàn thành giao dịch với người mua?')) return;

    try {
      const response = await fetch(`http://localhost:3001/auction/${auctionId}/complete-transaction`, {
        method: 'PUT'
      });
      const data = await response.json();
      if (data.success) {
        alert('Đã đánh dấu giao dịch hoàn thành!');
        fetchMyAuctions();
        setShowWinnerModal(false);
      }
    } catch (err) {
      console.error('Error completing transaction:', err);
      alert('Có lỗi xảy ra');
    }
  };

  const cancelAuction = async (auctionId) => {
    if (!confirm('Bạn chắc chắn muốn hủy phiên đấu giá này?')) return;

    try {
      const response = await fetch(`http://localhost:3001/auction/${auctionId}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Seller cancelled' })
      });
      const data = await response.json();
      if (data.success) {
        alert('Đã hủy phiên đấu giá');
        fetchMyAuctions();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error('Error cancelling auction:', err);
      alert('Có lỗi xảy ra');
    }
  };

  const contactWinner = (auction) => {
    navigate(`/messages/${auction.highest_bidder_id}`, {
      state: { auctionId: auction.auction_id, productName: auction.product_name }
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getStatusBadge = (status, startTime) => {
    const now = new Date();
    const start = new Date(startTime);
    
    let badge;
    if (status === 'ACTIVE' && start > now) {
      badge = { text: 'Đang chờ lên sàn', class: 'bg-info/10 text-info' };
    } else if (status === 'ACTIVE') {
      badge = { text: 'Đang diễn ra', class: 'bg-success/10 text-success' };
    } else if (status === 'PENDING') {
      badge = { text: 'Chờ duyệt', class: 'bg-warning/10 text-warning' };
    } else if (status === 'COMPLETED') {
      badge = { text: 'Đã kết thúc', class: 'bg-primary/10 text-primary' };
    } else {
      badge = { text: 'Đã hủy', class: 'bg-danger/10 text-danger' };
    }
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.class}`}>
        {badge.text}
      </span>
    );
  };

  const calculateProfit = (current, starting) => {
    const profit = current - starting;
    const percent = ((profit / starting) * 100).toFixed(1);
    return { profit, percent };
  };

  const filters = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Chờ duyệt', value: 'PENDING' },
    { label: 'Đang chờ lên sàn', value: 'WAITING' },
    { label: 'Đang diễn ra', value: 'ACTIVE' },
    { label: 'Đã kết thúc', value: 'COMPLETED' },
    { label: 'Đã hủy', value: 'CANCELLED' }
  ];

  return (
    <div className="min-h-screen bg-background-dark">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Quản lý tin đấu giá</h1>
            <p className="text-text-secondary">
              Quản lý các phiên đấu giá của bạn và theo dõi kết quả
            </p>
          </div>
          <Link to="/create-auction" className="btn-primary">
            <span className="material-symbols-outlined">add</span>
            Tạo phiên mới
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setFilterStatus(filter.value)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filterStatus === filter.value
                  ? 'bg-primary text-white'
                  : 'bg-surface-dark text-text-secondary hover:text-white hover:bg-white/5'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-12">
            <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">Đang tải...</p>
          </div>
        ) : auctions.length === 0 ? (
          /* Empty State */
          <div className="card text-center py-12">
            <div className="size-16 rounded-full bg-surface-dark flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-4xl text-text-secondary">
                inventory_2
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Chưa có phiên đấu giá nào
            </h3>
            <p className="text-text-secondary mb-6">
              Tạo phiên đấu giá đầu tiên của bạn ngay bây giờ
            </p>
            <Link to="/create-auction" className="btn-primary inline-flex">
              Tạo phiên đấu giá
            </Link>
          </div>
        ) : (
          /* Auctions List */
          <div className="space-y-4">
            {auctions.map((auction) => {
              const { profit, percent } = calculateProfit(auction.current_price, auction.starting_price);
              const isPositive = profit > 0;

              return (
                <div key={auction.auction_id} className="card hover:border-primary/30 transition-all">
                  <div className="flex gap-4">
                    {/* Image */}
                    <img
                      src={auction.image_url || 'https://via.placeholder.com/200x150?text=No+Image'}
                      alt={auction.product_name}
                      className="w-48 h-36 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/200x150?text=No+Image';
                      }}
                    />

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-2">
                            {auction.product_name}
                          </h3>
                          {getStatusBadge(auction.status, auction.start_time)}
                        </div>
                        <Link
                          to={`/auction/${auction.auction_id}`}
                          className="text-primary hover:text-primary/80"
                        >
                          <span className="material-symbols-outlined">open_in_new</span>
                        </Link>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {/* Starting Price */}
                        <div>
                          <p className="text-text-secondary text-sm mb-1">Giá khởi điểm</p>
                          <p className="text-white font-semibold">
                            {formatPrice(auction.starting_price)}
                          </p>
                        </div>

                        {/* Current Price */}
                        <div>
                          <p className="text-text-secondary text-sm mb-1">Giá hiện tại</p>
                          <p className="text-primary font-bold text-lg">
                            {formatPrice(auction.current_price)}
                          </p>
                        </div>

                        {/* Profit */}
                        <div>
                          <p className="text-text-secondary text-sm mb-1">Tăng trưởng</p>
                          <p className={`font-semibold ${isPositive ? 'text-success' : 'text-text-secondary'}`}>
                            {isPositive ? '+' : ''}{formatPrice(profit)}
                            <span className="text-sm ml-1">({percent}%)</span>
                          </p>
                        </div>

                        {/* Bids */}
                        <div>
                          <p className="text-text-secondary text-sm mb-1">Lượt đấu giá</p>
                          <p className="text-white font-semibold flex items-center gap-1">
                            <span className="material-symbols-outlined text-lg">gavel</span>
                            {auction.total_bids} lượt
                          </p>
                        </div>
                      </div>

                      {/* Highest Bidder */}
                      {auction.highest_bidder_id && (
                        <div className="flex items-center gap-2 mb-4 p-3 bg-surface-dark rounded-lg">
                          {auction.highest_bidder_avatar ? (
                            <img
                              src={auction.highest_bidder_avatar}
                              alt="Bidder"
                              className="size-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
                              {(auction.highest_bidder_fullname || auction.highest_bidder_email || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-text-secondary text-sm">Người đặt giá cao nhất</p>
                            <p className="text-white font-medium">
                              {auction.highest_bidder_fullname || auction.highest_bidder_username}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-3">
                        {auction.status === 'COMPLETED' && auction.highest_bidder_id && (
                          <>
                            <button
                              onClick={() => showWinnerDetails(auction)}
                              className="btn-primary flex-1"
                            >
                              <span className="material-symbols-outlined">emoji_events</span>
                              Xem người thắng
                            </button>
                            <button
                              onClick={() => contactWinner(auction)}
                              className="btn-secondary flex-1"
                            >
                              <span className="material-symbols-outlined">chat</span>
                              Liên hệ người mua
                            </button>
                          </>
                        )}
                        {auction.status === 'ACTIVE' && new Date(auction.start_time) > new Date() && auction.total_bids === 0 && (
                          <>
                            <Link
                              to={`/edit-auction/${auction.auction_id}`}
                              className="btn-primary flex-1"
                            >
                              <span className="material-symbols-outlined">edit</span>
                              Sửa thông tin
                            </Link>
                            <button
                              onClick={() => cancelAuction(auction.auction_id)}
                              className="btn-secondary text-danger flex-1"
                            >
                              <span className="material-symbols-outlined">cancel</span>
                              Hủy phiên
                            </button>
                          </>
                        )}
                        {auction.status === 'ACTIVE' && new Date(auction.start_time) <= new Date() && auction.total_bids === 0 && (
                          <button
                            onClick={() => cancelAuction(auction.auction_id)}
                            className="btn-secondary text-danger"
                          >
                            <span className="material-symbols-outlined">cancel</span>
                            Hủy phiên
                          </button>
                        )}
                        {auction.status === 'PENDING' && (
                          <Link
                            to={`/edit-auction/${auction.auction_id}`}
                            className="btn-secondary"
                          >
                            <span className="material-symbols-outlined">edit</span>
                            Chỉnh sửa
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Winner Modal */}
      {showWinnerModal && selectedAuction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-surface-dark rounded-xl max-w-md w-full p-6 border border-border-dark">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">🎉 Người thắng đấu giá</h2>
              <button
                onClick={() => setShowWinnerModal(false)}
                className="size-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-text-secondary"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Winner Info */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-4 p-4 bg-background-dark rounded-lg">
                {selectedAuction.highest_bidder_avatar ? (
                  <img
                    src={selectedAuction.highest_bidder_avatar}
                    alt="Winner"
                    className="size-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="size-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold">
                    {(selectedAuction.highest_bidder_fullname || selectedAuction.highest_bidder_email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-white font-bold text-lg">
                    {selectedAuction.highest_bidder_fullname || selectedAuction.highest_bidder_username}
                  </p>
                  <p className="text-text-secondary text-sm">{selectedAuction.highest_bidder_email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between p-3 bg-background-dark rounded-lg">
                  <span className="text-text-secondary">Giá trúng đấu giá</span>
                  <span className="text-primary font-bold">{formatPrice(selectedAuction.current_price)}</span>
                </div>
                <div className="flex justify-between p-3 bg-background-dark rounded-lg">
                  <span className="text-text-secondary">Số điện thoại</span>
                  <span className="text-white font-medium">
                    {selectedAuction.highest_bidder_phone || 'Chưa cập nhật'}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-background-dark rounded-lg">
                  <span className="text-text-secondary">Trạng thái giao dịch</span>
                  <span className={selectedAuction.transaction_completed ? 'text-success' : 'text-warning'}>
                    {selectedAuction.transaction_completed ? '✓ Đã hoàn thành' : 'Chưa hoàn thành'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => contactWinner(selectedAuction)}
                className="btn-primary flex-1"
              >
                <span className="material-symbols-outlined">chat</span>
                Nhắn tin
              </button>
              {!selectedAuction.transaction_completed && (
                <button
                  onClick={() => completeTransaction(selectedAuction.auction_id)}
                  className="btn-secondary flex-1"
                >
                  <span className="material-symbols-outlined">check_circle</span>
                  Xác nhận hoàn thành
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyAuctions;
