import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState('');

  const handleSubscribe = async (e) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setSubscribeStatus('error');
      setTimeout(() => setSubscribeStatus(''), 3000);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        setSubscribeStatus('success');
        setEmail('');
        setTimeout(() => setSubscribeStatus(''), 3000);
      } else {
        setSubscribeStatus('error');
        setTimeout(() => setSubscribeStatus(''), 3000);
      }
    } catch (err) {
      console.error('Newsletter subscription error:', err);
      setSubscribeStatus('error');
      setTimeout(() => setSubscribeStatus(''), 3000);
    }
  };

  const footerLinks = {
    'Dịch vụ': [
      { label: 'Đấu giá', to: '/auctions' },
      { label: 'Bán hàng', to: '#' },
      { label: 'Định giá', to: '#' },
      { label: 'Vận chuyển', to: '#' },
    ],
    'Hỗ trợ': [
      { label: 'Trung tâm trợ giúp', to: '#' },
      { label: 'Hướng dẫn đấu giá', to: '#' },
      { label: 'Phí & Thanh toán', to: '#' },
      { label: 'Liên hệ', to: '#' },
    ],
    'Pháp lý': [
      { label: 'Điều khoản sử dụng', to: '#' },
      { label: 'Chính sách bảo mật', to: '#' },
      { label: 'Chính sách cookie', to: '#' },
    ],
  };

  const socialLinks = [
    { icon: 'smart_display', label: 'YouTube', href: '#' },
    { icon: 'group', label: 'Facebook', href: '#' },
    { icon: 'chat', label: 'Zalo', href: '#' },
  ];

  return (
    <footer className="border-t border-border-dark bg-background-dark">
      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-4 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-white">
                <span className="material-symbols-outlined text-xl">gavel</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Sàn Đấu Giá 24/7</h2>
                <p className="text-xs text-text-secondary">Trực tuyến & Minh bạch</p>
              </div>
            </Link>
            <p className="text-text-secondary text-sm leading-relaxed mb-6 max-w-sm">
              Nền tảng đấu giá trực tuyến uy tín hàng đầu Việt Nam. Công nghệ realtime, 
              giao dịch an toàn, minh bạch tuyệt đối.
            </p>
            
            {/* Newsletter */}
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Email của bạn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input flex-1 text-sm py-2.5"
                  required
                />
                <button type="submit" className="btn-primary whitespace-nowrap">
                  Đăng ký
                </button>
              </div>
              {subscribeStatus === 'success' && (
                <p className="text-success text-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Đăng ký thành công!
                </p>
              )}
              {subscribeStatus === 'error' && (
                <p className="text-danger text-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">error</span>
                  Có lỗi xảy ra, vui lòng thử lại
                </p>
              )}
            </form>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-white font-semibold mb-4">{title}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-text-secondary hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border-dark">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-text-muted">
            © {currentYear} SanDauGia247. All rights reserved.
          </p>
          
          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="flex size-9 items-center justify-center rounded-lg text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">{social.icon}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
