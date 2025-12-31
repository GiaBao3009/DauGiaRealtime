import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1); // 1: Enter email, 2: Enter code, 3: Reset password
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Mã xác thực đã được gửi đến email của bạn');
        setStep(2);
      } else {
        setError(data.error || 'Email không tồn tại');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('Không thể kết nối đến server');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: resetCode })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Mã xác thực đúng! Vui lòng nhập mật khẩu mới');
        setStep(3);
      } else {
        setError(data.error || 'Mã xác thực không đúng');
      }
    } catch (err) {
      console.error('Verify code error:', err);
      setError('Không thể xác thực mã');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: resetCode, newPassword })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Đặt lại mật khẩu thành công! Đang chuyển đến trang đăng nhập...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(data.error || 'Không thể đặt lại mật khẩu');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError('Không thể đặt lại mật khẩu');
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
            <span className="material-symbols-outlined text-3xl">lock_reset</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Quên mật khẩu</h1>
          <p className="text-text-secondary">
            {step === 1 && 'Nhập email để nhận mã xác thực'}
            {step === 2 && 'Nhập mã xác thực đã gửi đến email'}
            {step === 3 && 'Tạo mật khẩu mới cho tài khoản'}
          </p>
        </div>

        {/* Form Card */}
        <div className="card">
          {/* Progress Steps */}
          <div className="flex justify-between mb-8">
            <div className="flex flex-col items-center flex-1">
              <div className={`size-10 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-primary text-white' : 'bg-white/5 text-text-secondary'
              }`}>
                1
              </div>
              <span className="text-xs text-text-secondary mt-2">Email</span>
            </div>
            <div className={`flex-1 h-0.5 self-center ${step >= 2 ? 'bg-primary' : 'bg-white/5'} -mx-4`}></div>
            <div className="flex flex-col items-center flex-1">
              <div className={`size-10 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-primary text-white' : 'bg-white/5 text-text-secondary'
              }`}>
                2
              </div>
              <span className="text-xs text-text-secondary mt-2">Mã xác thực</span>
            </div>
            <div className={`flex-1 h-0.5 self-center ${step >= 3 ? 'bg-primary' : 'bg-white/5'} -mx-4`}></div>
            <div className="flex flex-col items-center flex-1">
              <div className={`size-10 rounded-full flex items-center justify-center ${
                step >= 3 ? 'bg-primary text-white' : 'bg-white/5 text-text-secondary'
              }`}>
                3
              </div>
              <span className="text-xs text-text-secondary mt-2">Mật khẩu mới</span>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-danger/10 border border-danger/20">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-lg bg-success/10 border border-success/20">
              <p className="text-success text-sm">{success}</p>
            </div>
          )}

          {/* Step 1: Enter Email */}
          {step === 1 && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="example@email.com"
                  className="input w-full"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang gửi...
                  </span>
                ) : (
                  'Gửi mã xác thực'
                )}
              </button>
            </form>
          )}

          {/* Step 2: Enter Reset Code */}
          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Mã xác thực *
                </label>
                <input
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  required
                  placeholder="Nhập mã 6 chữ số"
                  maxLength={6}
                  className="input w-full text-center text-2xl tracking-widest"
                />
                <p className="text-xs text-text-secondary mt-2">
                  Mã xác thực đã được gửi đến <span className="text-primary">{email}</span>
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary flex-1"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1"
                >
                  {loading ? 'Đang xác thực...' : 'Xác thực'}
                </button>
              </div>

              <button
                type="button"
                onClick={handleSendCode}
                className="text-primary text-sm hover:underline w-full text-center"
              >
                Gửi lại mã
              </button>
            </form>
          )}

          {/* Step 3: Reset Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Mật khẩu mới *
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Xác nhận mật khẩu *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Nhập lại mật khẩu mới"
                  className="input w-full"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang đặt lại...
                  </span>
                ) : (
                  'Đặt lại mật khẩu'
                )}
              </button>
            </form>
          )}

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-text-secondary text-sm">
              Đã nhớ mật khẩu?{' '}
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

export default ForgotPassword;
