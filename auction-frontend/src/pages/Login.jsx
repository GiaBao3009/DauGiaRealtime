import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (isLogin) {
      const result = await login(formData.username, formData.password);
      if (result.success) {
        if (result.user.role_id === 1) {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(result.message);
      }
    } else {
      if (!formData.email) {
        setError('Vui lòng nhập email');
        setLoading(false);
        return;
      }
      const result = await register(formData.username, formData.password, formData.email);
      if (result.success) {
        setSuccess('Đăng ký thành công! Vui lòng đăng nhập.');
        setIsLogin(true);
        setFormData({ username: '', password: '', email: '' });
      } else {
        setError(result.message);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-dark">
      {/* Header */}
      <header className="border-b border-border-dark glass">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 lg:px-8">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/25">
              <span className="material-symbols-outlined text-xl">gavel</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-white leading-none">Sàn Đấu Giá</h1>
              <p className="text-xs text-text-secondary">Trực tuyến 24/7</p>
            </div>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[600px] border border-border-dark">
          {/* Left Side - Image */}
          <div className="relative hidden md:flex w-full md:w-1/2 flex-col justify-end p-10 bg-cover bg-center" 
               style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1555421689-491a97ff2040?q=80&w=1000&auto=format&fit=crop")' }}>
            <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/60 to-transparent" />
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="badge-live">
                  <span className="material-symbols-outlined text-sm">bolt</span>
                  Realtime
                </span>
              </div>
              <h3 className="text-white text-3xl font-bold leading-tight">
                Nhanh chóng.<br/>Minh bạch.<br/>Thời gian thực.
              </h3>
              <p className="text-text-secondary text-base max-w-xs">
                Tham gia vào hệ thống đấu giá chuyên nghiệp hàng đầu Việt Nam.
              </p>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="w-full md:w-1/2 flex flex-col bg-surface-dark">
            {/* Tabs */}
            <div className="flex border-b border-border-dark">
              <button 
                onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
                className={`flex-1 py-4 text-center font-semibold text-sm tracking-wide transition-all relative ${
                  isLogin 
                    ? 'text-white' 
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                ĐĂNG NHẬP
                {isLogin && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
              </button>
              <button 
                onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
                className={`flex-1 py-4 text-center font-semibold text-sm tracking-wide transition-all relative ${
                  !isLogin 
                    ? 'text-white' 
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                ĐĂNG KÝ
                {!isLogin && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 p-8 lg:p-12 flex flex-col justify-center">
              <div className="mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                  {isLogin ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}
                </h1>
                <p className="text-text-secondary">
                  {isLogin ? 'Nhập thông tin tài khoản để tiếp tục.' : 'Đăng ký để tham gia đấu giá.'}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm flex items-center gap-3">
                  <span className="material-symbols-outlined">error</span>
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 rounded-xl bg-success/10 border border-success/20 text-success text-sm flex items-center gap-3">
                  <span className="material-symbols-outlined">check_circle</span>
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-white" htmlFor="username">
                    Tên đăng nhập
                  </label>
                  <input 
                    className="input" 
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="username" 
                    type="text"
                    required
                  />
                </div>

                {!isLogin && (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-white" htmlFor="email">
                      Email
                    </label>
                    <input 
                      className="input" 
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="user@example.com" 
                      type="email"
                      required={!isLogin}
                    />
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-white" htmlFor="password">
                    Mật khẩu
                  </label>
                  <input 
                    className="input" 
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••" 
                    type="password"
                    required
                  />
                </div>

                {isLogin && (
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 text-text-secondary cursor-pointer">
                      <input type="checkbox" className="rounded bg-input-dark border-border-dark text-primary focus:ring-primary" />
                      Ghi nhớ đăng nhập
                    </label>
                    <Link to="/forgot-password" className="text-primary hover:underline">Quên mật khẩu?</Link>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className="btn-primary h-12 mt-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">{isLogin ? 'login' : 'person_add'}</span>
                      {isLogin ? 'Đăng nhập' : 'Đăng ký'}
                    </>
                  )}
                </button>
              </form>

              {/* Social Login */}
              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border-dark" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-surface-dark px-4 text-text-secondary">hoặc tiếp tục với</span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <button className="btn-secondary h-11">
                    <svg className="size-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google
                  </button>
                  <button className="btn-secondary h-11">
                    <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </button>
                </div>

                {/* Register Link */}
                <div className="mt-6 text-center">
                  <p className="text-text-secondary text-sm">
                    {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
                    <Link 
                      to={isLogin ? '/register' : '/login'} 
                      className="text-primary font-medium hover:underline"
                    >
                      {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;