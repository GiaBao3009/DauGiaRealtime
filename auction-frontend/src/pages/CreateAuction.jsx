import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

function CreateAuction() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    starting_price: '',
    category_id: '',
    start_time: '',
    end_time: '',
    image_url: ''
  });
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // Load categories
  React.useEffect(() => {
    fetch('http://localhost:3001/categories')
      .then(res => res.json())
      .then(data => {
        const cats = data.categories || [];
        setCategories(cats);
        // Set first category as default
        if (cats.length > 0) {
          setFormData(prev => ({ ...prev, category_id: cats[0].category_id.toString() }));
        }
      })
      .catch(err => console.error('Error loading categories:', err));
  }, []);

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

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 5MB');
      return;
    }

    setSelectedFile(file);
    
    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Auto upload
    await uploadImage(file);
  };

  const uploadImage = async (file) => {
    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('image', file);

    try {
      const response = await fetch('http://localhost:3001/upload', {
        method: 'POST',
        body: formDataUpload
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, image_url: data.imageUrl }));
      } else {
        alert('Upload ảnh thất bại');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Không thể upload ảnh');
    } finally {
      setUploading(false);
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
      const response = await fetch('http://localhost:3001/auctions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          seller_id: user.user_id,
          start_time: new Date(formData.start_time).toISOString(),
          end_time: new Date(formData.end_time).toISOString()
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert('Tạo phiên đấu giá thành công! Phiên đấu giá sẽ được admin xét duyệt trước khi lên sàn.');
        navigate('/my-auctions');
      } else {
        alert('Có lỗi xảy ra, vui lòng thử lại');
      }
    } catch (err) {
      console.error('Error creating auction:', err);
      alert('Không thể tạo phiên đấu giá');
    } finally {
      setSubmitting(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-white mb-2">Tạo phiên đấu giá mới</h1>
          <p className="text-text-secondary">Điền thông tin để tạo phiên đấu giá của bạn</p>
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

          {/* Category */}
          <div className="card">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Danh mục <span className="text-danger">*</span>
            </label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className="input w-full"
            >
              {categories.length === 0 ? (
                <option value="">Đang tải danh mục...</option>
              ) : (
                categories.map(cat => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.category_name}
                  </option>
                ))
              )}
            </select>
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

          {/* Image Upload */}
          <div className="card">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Hình ảnh sản phẩm
            </label>
            
            {/* File Upload */}
            <div className="mb-4">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border-dark rounded-lg cursor-pointer hover:border-primary transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <span className="material-symbols-outlined text-4xl text-text-secondary mb-2">
                    {uploading ? 'hourglass_empty' : 'cloud_upload'}
                  </span>
                  <p className="text-sm text-text-secondary">
                    {uploading ? 'Đang tải lên...' : 'Click để chọn ảnh hoặc kéo thả vào đây'}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">PNG, JPG, GIF (max 5MB)</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </label>
            </div>

            {/* Or URL input */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-dark"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background-dark text-text-secondary">hoặc nhập URL</span>
              </div>
            </div>

            <input
              type="url"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              className="input w-full mt-4"
            />

            {/* Image Preview */}
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
                  Đang tạo...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined">add_circle</span>
                  Tạo phiên đấu giá
                </span>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default CreateAuction;
