import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:3001/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role_id: 2 // Default user role
        })
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/login', { 
          state: { message: 'Đăng ký thành công! Vui lòng đăng nhập.' }
        });
      } else {
        setError(data.error || 'Đăng ký thất bại');
      }
    } catch (err) {
      console.error('Register error:', err);
      setError('Không thể kết nối đến server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-dark flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-primary text-white mb-4">
            <span className="material-symbols-outlined text-3xl">gavel</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Tạo tài khoản</h1>
          <p className="text-text-secondary">Đăng ký để tham gia đấu giá</p>
        </div>

        {/* Registration Form */}
        <div className="card">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-danger/10 border border-danger/20">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Tên đăng nhập *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="Nhập tên đăng nhập"
                className="input w-full"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="example@email.com"
                className="input w-full"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Mật khẩu *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                className="input w-full"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Xác nhận mật khẩu *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Nhập lại mật khẩu"
                className="input w-full"
              />
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2">
              <input 
                type="checkbox" 
                id="terms" 
                required 
                className="mt-1 size-4 accent-primary"
              />
              <label htmlFor="terms" className="text-sm text-text-secondary">
                Tôi đồng ý với{' '}
                <Link to="/terms" className="text-primary hover:underline">
                  Điều khoản dịch vụ
                </Link>
                {' '}và{' '}
                <Link to="/privacy" className="text-primary hover:underline">
                  Chính sách bảo mật
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang đăng ký...
                </span>
              ) : (
                'Đăng ký'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-text-secondary text-sm">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-text-secondary hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            <span>Quay về trang chủ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
