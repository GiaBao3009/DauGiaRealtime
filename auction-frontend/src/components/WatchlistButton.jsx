import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function WatchlistButton({ auctionId, className = "", size = "md" }) {
  const { user } = useAuth();
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && auctionId) {
      checkWatchlistStatus();
    }
  }, [user, auctionId]);

  const checkWatchlistStatus = async () => {
    try {
      const response = await fetch(`http://localhost:3001/user/${user.user_id}/watchlist/check/${auctionId}`);
      const data = await response.json();
      if (data.success) {
        setInWatchlist(data.inWatchlist);
      }
    } catch (err) {
      console.error('Error checking watchlist:', err);
    }
  };

  const toggleWatchlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert('Vui lòng đăng nhập để sử dụng tính năng này');
      return;
    }

    setLoading(true);
    try {
      if (inWatchlist) {
        // Remove from watchlist
        const response = await fetch(`http://localhost:3001/user/${user.user_id}/watchlist/${auctionId}`, {
          method: 'DELETE'
        });
        const data = await response.json();
        if (data.success) {
          setInWatchlist(false);
        }
      } else {
        // Add to watchlist
        const response = await fetch(`http://localhost:3001/user/${user.user_id}/watchlist/${auctionId}`, {
          method: 'POST'
        });
        const data = await response.json();
        if (data.success) {
          setInWatchlist(true);
        }
      }
    } catch (err) {
      console.error('Error toggling watchlist:', err);
      alert('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'size-8 text-lg',
    md: 'size-9 text-xl',
    lg: 'size-10 text-2xl'
  };

  return (
    <button
      onClick={toggleWatchlist}
      disabled={loading}
      className={`${sizeClasses[size]} rounded-full bg-black/50 backdrop-blur flex items-center justify-center transition-all hover:bg-primary ${
        inWatchlist ? 'text-red-500' : 'text-white'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      title={inWatchlist ? 'Bỏ theo dõi' : 'Thêm vào danh sách theo dõi'}
    >
      <span className={`material-symbols-outlined ${inWatchlist ? 'filled' : ''}`}>
        favorite
      </span>
    </button>
  );
}

export default WatchlistButton;
