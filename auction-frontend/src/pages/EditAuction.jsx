import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

function EditAuction() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    starting_price: '',
    start_time: '',
    end_time: '',
    image_url: '',
    status: 'pending'
  });
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    fetchAuctionData();
  }, [id]);

  const fetchAuctionData = async () => {
    try {
      const response = await fetch(`http://localhost:3001/auctions/${id}`);
      const data = await response.json();
      
      if (data.auction) {
        const auction = data.auction;
        setFormData({
          title: auction.title,
          description: auction.description,
          starting_price: auction.starting_price,
          start_time: new Date(auction.start_time).toISOString().slice(0, 16),
          end_time: new Date(auction.end_time).toISOString().slice(0, 16),
          image_url: auction.image_url || '',
          status: auction.status
        });
        setImagePreview(auction.image_url || '');
      }
    } catch (err) {
      console.error('Error fetching auction:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'image_url') {
      setImagePreview(value);
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Vui lòng nhập tiêu đề';
    if (!formData.description.trim()) newErrors.description = 'Vui lòng nhập mô tả';
    if (!formData.starting_price || formData.starting_price <= 0) {
      newErrors.starting_price = 'Giá khởi điểm phải lớn hơn 0';
    }
    if (!formData.start_time) newErrors.start_time = 'Vui lòng chọn thời gian bắt đầu';
    if (!formData.end_time) newErrors.end_time = 'Vui lòng chọn thời gian kết thúc';
    
    if (formData.start_time && formData.end_time) {
      if (new Date(formData.start_time) >= new Date(formData.end_time)) {
        newErrors.end_time = 'Thời gian kết thúc phải sau thời gian bắt đầu';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    
    try {
      const response = await fetch(`http://localhost:3001/auctions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          start_time: new Date(formData.start_time).toISOString(),
          end_time: new Date(formData.end_time).toISOString(),
          user_id: user.user_id,
          role_id: user.role_id
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Cập nhật phiên đấu giá thành công!');
        navigate(`/auction/${id}`);
      } else {
        alert(data.message || 'Có lỗi xảy ra, vui lòng thử lại');
      }
    } catch (err) {
      console.error('Error updating auction:', err);
      alert('Không thể cập nhật phiên đấu giá');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="relative size-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-surface-dark" />
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
            <p className="text-text-secondary">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-dark">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors mb-4"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Quay lại</span>
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">Chỉnh sửa phiên đấu giá</h1>
          <p className="text-text-secondary">Cập nhật thông tin phiên đấu giá của bạn</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="card">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Tiêu đề phiên đấu giá <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="VD: iPhone 15 Pro Max 256GB - Nguyên seal"
              className={`input w-full ${errors.title ? 'border-danger' : ''}`}
            />
            {errors.title && (
              <p className="text-danger text-sm mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {errors.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="card">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Mô tả chi tiết <span className="text-danger">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={6}
              placeholder="Mô tả chi tiết về sản phẩm: tình trạng, nguồn gốc, bảo hành..."
              className={`input w-full resize-none ${errors.description ? 'border-danger' : ''}`}
            />
            {errors.description && (
              <p className="text-danger text-sm mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {errors.description}
              </p>
            )}
          </div>

          {/* Price */}
          <div className="card">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Giá khởi điểm <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                name="starting_price"
                value={formData.starting_price}
                onChange={handleChange}
                placeholder="0"
                min="0"
                step="10000"
                className={`input w-full pr-16 ${errors.starting_price ? 'border-danger' : ''}`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary">VNĐ</span>
            </div>
            {errors.starting_price && (
              <p className="text-danger text-sm mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {errors.starting_price}
              </p>
            )}
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Thời gian bắt đầu <span className="text-danger">*</span>
              </label>
              <input
                type="datetime-local"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                className={`input w-full ${errors.start_time ? 'border-danger' : ''}`}
              />
              {errors.start_time && (
                <p className="text-danger text-sm mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {errors.start_time}
                </p>
              )}
            </div>

            <div className="card">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Thời gian kết thúc <span className="text-danger">*</span>
              </label>
              <input
                type="datetime-local"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                className={`input w-full ${errors.end_time ? 'border-danger' : ''}`}
              />
              {errors.end_time && (
                <p className="text-danger text-sm mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {errors.end_time}
                </p>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="card">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Trạng thái
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="input w-full"
            >
              <option value="pending">Chờ duyệt</option>
              <option value="active">Đang diễn ra</option>
              <option value="upcoming">Sắp diễn ra</option>
              <option value="ended">Đã kết thúc</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>

          {/* Image URL */}
          <div className="card">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Link hình ảnh (URL)
            </label>
            <input
              type="url"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              className="input w-full"
            />
            {imagePreview && (
              <div className="mt-4">
                <p className="text-sm text-text-secondary mb-2">Xem trước:</p>
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full max-w-md h-64 object-cover rounded-xl border border-border-dark"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary flex-1"
              disabled={submitting}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang cập nhật...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined">save</span>
                  Cập nhật
                </span>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default EditAuction;
