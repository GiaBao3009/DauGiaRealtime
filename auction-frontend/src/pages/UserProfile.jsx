import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

function UserProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    phone_number: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        full_name: user.full_name || '',
        phone_number: user.phone_number || ''
      });
      setAvatarUrl(user.avatar_url || '');
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setMessage('Vui lòng chọn file ảnh (JPG, PNG, GIF, WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage('Kích thước ảnh tối đa 5MB');
      return;
    }

    setUploadingAvatar(true);
    setMessage('');

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('avatar', file);

      const response = await fetch(`http://localhost:3001/user/${user.user_id}/avatar`, {
        method: 'POST',
        body: formDataUpload
      });

      const data = await response.json();

      if (response.ok) {
        setAvatarUrl(data.avatarUrl);
        setMessage('Cập nhật ảnh đại diện thành công!');
        
        // Update local storage
        const updatedUser = { ...user, avatar_url: data.avatarUrl };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Reset file input
        e.target.value = '';
      } else {
        setMessage(data.message || 'Không thể upload ảnh');
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setMessage('Có lỗi xảy ra khi upload ảnh');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`http://localhost:3001/user/${user.user_id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setMessage('Cập nhật thông tin thành công!');
        setEditing(false);
        // Update local storage
        const updatedUser = { ...user, ...formData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        setMessage('Có lỗi xảy ra, vui lòng thử lại');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setMessage('Không thể cập nhật thông tin');
    } finally {
      setLoading(false);
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
          <h1 className="text-3xl font-bold text-white mb-2">Thông tin cá nhân</h1>
          <p className="text-text-secondary">Quản lý thông tin tài khoản của bạn</p>
        </div>

        {/* Profile Card */}
        <div className="card">
          {/* Avatar Section */}
          <div className="flex items-center gap-6 pb-6 border-b border-border-dark">
            <div className="relative">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Avatar" 
                  className="size-24 rounded-full object-cover border-4 border-primary/20"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="size-24 rounded-full bg-primary flex items-center justify-center text-white text-4xl font-bold"
                style={{ display: avatarUrl ? 'none' : 'flex' }}
              >
                {(formData.full_name || formData.email).charAt(0).toUpperCase()}
              </div>
              
              {/* Upload button */}
              <label 
                htmlFor="avatar-upload" 
                className="absolute bottom-0 right-0 size-8 rounded-full bg-primary hover:bg-primary-dark flex items-center justify-center cursor-pointer transition-colors shadow-lg"
                title="Thay đổi ảnh đại diện"
              >
                {uploadingAvatar ? (
                  <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-white text-sm">photo_camera</span>
                )}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploadingAvatar}
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{formData.full_name || formData.username}</h2>
              <p className="text-text-secondary">{formData.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 rounded-full bg-success/20 text-success text-xs font-medium">
                  ✓ Đã xác thực
                </span>
                <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
                  {user?.role_id === 1 ? 'Admin' : 'Thành viên'}
                </span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* Username - Read only */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Tên đăng nhập
              </label>
              <input
                type="text"
                value={formData.username}
                disabled
                className="input w-full bg-white/5 cursor-not-allowed"
              />
              <p className="text-xs text-text-secondary mt-1">Không thể thay đổi tên đăng nhập</p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!editing}
                className={`input w-full ${!editing ? 'bg-white/5' : ''}`}
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Họ và tên
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                disabled={!editing}
                placeholder="Nhập họ và tên"
                className={`input w-full ${!editing ? 'bg-white/5' : ''}`}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Số điện thoại
              </label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                disabled={!editing}
                placeholder="Nhập số điện thoại"
                className={`input w-full ${!editing ? 'bg-white/5' : ''}`}
              />
            </div>

            {/* Success/Error Message */}
            {message && (
              <div className={`p-4 rounded-lg ${
                message.includes('thành công') 
                  ? 'bg-success/10 border border-success/20 text-success' 
                  : 'bg-danger/10 border border-danger/20 text-danger'
              }`}>
                {message}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              {!editing ? (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="btn-primary"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined">edit</span>
                    Chỉnh sửa thông tin
                  </span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setFormData({
                        username: user.username || '',
                        email: user.email || '',
                        full_name: user.full_name || '',
                        phone_number: user.phone_number || ''
                      });
                    }}
                    className="btn-secondary flex-1"
                    disabled={loading}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Đang lưu...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined">save</span>
                        Lưu thay đổi
                      </span>
                    )}
                  </button>
                </>
              )}
            </div>
          </form>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">gavel</span>
              </div>
              <div>
                <p className="text-text-secondary text-sm">Đã tham gia</p>
                <p className="text-white text-2xl font-bold">24</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-lg bg-success/20 flex items-center justify-center text-success">
                <span className="material-symbols-outlined">emoji_events</span>
              </div>
              <div>
                <p className="text-text-secondary text-sm">Đã thắng</p>
                <p className="text-white text-2xl font-bold">8</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-lg bg-warning/20 flex items-center justify-center text-warning">
                <span className="material-symbols-outlined">stars</span>
              </div>
              <div>
                <p className="text-text-secondary text-sm">Điểm uy tín</p>
                <p className="text-white text-2xl font-bold">{user?.trust_score || 100}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default UserProfile;
