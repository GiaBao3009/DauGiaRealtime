# 🚀 HƯỚNG DẪN CHẠY HỆ THỐNG ĐẤU GIÁ TRỰC TUYẾN

## 📋 YÊU CẦU HỆ THỐNG
- Node.js v16+
- SQL Server (Windows Authentication)
- Trình duyệt hiện đại (Chrome, Firefox, Edge)

---

## 🗄️ BƯỚC 1: THIẾT LẬP DATABASE

### 1.1 Tạo Database
Mở SQL Server Management Studio và chạy script:

```sql
CREATE DATABASE auction_system;
GO

USE auction_system;
GO

-- Bảng Users
CREATE TABLE Users (
    user_id INT PRIMARY KEY IDENTITY(1,1),
    username NVARCHAR(50) UNIQUE NOT NULL,
    password CHAR(64) NOT NULL,  -- SHA-256 hash
    email NVARCHAR(100) UNIQUE NOT NULL,
    role_id INT DEFAULT 2,  -- 1: Admin, 2: User
    created_at DATETIME DEFAULT GETDATE()
);

-- Bảng Auctions
CREATE TABLE Auctions (
    auction_id INT PRIMARY KEY IDENTITY(1,1),
    title NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX),
    starting_price DECIMAL(15,2) NOT NULL,
    current_price DECIMAL(15,2) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    seller_id INT,
    image_url NVARCHAR(500),
    status NVARCHAR(20) DEFAULT 'pending',  -- pending, active, completed, cancelled
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (seller_id) REFERENCES Users(user_id)
);

-- Bảng Bids
CREATE TABLE Bids (
    bid_id INT PRIMARY KEY IDENTITY(1,1),
    auction_id INT NOT NULL,
    bidder_id INT NOT NULL,
    bid_amount DECIMAL(15,2) NOT NULL,
    bid_time DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (auction_id) REFERENCES Auctions(auction_id),
    FOREIGN KEY (bidder_id) REFERENCES Users(user_id)
);

-- Bảng Newsletter
CREATE TABLE Newsletter (
    id INT PRIMARY KEY IDENTITY(1,1),
    email NVARCHAR(100) UNIQUE NOT NULL,
    subscribed_at DATETIME DEFAULT GETDATE()
);

-- Tạo index để tăng hiệu năng
CREATE INDEX idx_auctions_status ON Auctions(status);
CREATE INDEX idx_bids_auction ON Bids(auction_id);
CREATE INDEX idx_users_username ON Users(username);
```

### 1.2 Thêm dữ liệu mẫu (Optional)
```sql
-- Thêm user admin (password: admin123)
INSERT INTO Users (username, password, email, role_id)
VALUES ('admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin@auction.com', 1);

-- Thêm user thường (password: user123)
INSERT INTO Users (username, password, email, role_id)
VALUES ('user1', '6ca13d52ca70c883e0f0bb101e425a89e8624de51db2d2392593af6a84118090', 'user1@auction.com', 2);

-- Thêm phiên đấu giá mẫu
INSERT INTO Auctions (title, description, starting_price, current_price, start_time, end_time, seller_id, image_url, status)
VALUES 
('iPhone 15 Pro Max 256GB', 'Máy mới 100%, fullbox, chính hãng VN/A', 25000000, 25000000, GETDATE(), DATEADD(DAY, 3, GETDATE()), 1, 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?q=80&w=1000', 'active'),
('MacBook Pro M3 Max', 'Laptop chuyên nghiệp cho developer', 50000000, 52500000, GETDATE(), DATEADD(HOUR, 12, GETDATE()), 1, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?q=80&w=1000', 'active'),
('Rolex Submariner Date', 'Đồng hồ chính hãng, còn BH 3 năm', 200000000, 210000000, GETDATE(), DATEADD(DAY, 1, GETDATE()), 1, 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=1000', 'active');
```

---

## ⚙️ BƯỚC 2: CẤU HÌNH BACKEND

### 2.1 Kiểm tra kết nối SQL Server
Mở file `auction-backend/server.js` và đảm bảo cấu hình đúng:

```javascript
const dbConfig = {
    server: 'BAOLDZ',       // Đổi thành tên SQL Server của bạn
    database: 'auction_system',
    driver: 'msnodesqlv8',
    options: {
        trustedConnection: true
    }
};
```

**Cách tìm tên SQL Server:**
- Mở SQL Server Management Studio
- Tên server hiển thị khi bạn đăng nhập
- Hoặc chạy lệnh: `SELECT @@SERVERNAME`

### 2.2 Cài đặt dependencies
```bash
cd auction-backend
npm install
```

### 2.3 Chạy Backend Server
```bash
node server.js
```

✅ Nếu thành công, bạn sẽ thấy:
```
✅ Đã kết nối SQL Server (BAOLDZ) thành công!
🚀 Server chạy tại port 3001
```

---

## 🎨 BƯỚC 3: CẤU HÌNH FRONTEND

### 3.1 Cài đặt dependencies
```bash
cd auction-frontend
npm install
```

### 3.2 Chạy Frontend Development Server
```bash
npm run dev
```

✅ Frontend sẽ chạy tại: **http://localhost:5173**

---

## 🧪 BƯỚC 4: KIỂM TRA HỆ THỐNG

### 4.1 Test Đăng ký/Đăng nhập
1. Mở trình duyệt: http://localhost:5173
2. Click vào **Đăng nhập** trên Header
3. Chuyển sang tab **ĐĂNG KÝ**
4. Nhập thông tin:
   - Username: `testuser`
   - Email: `test@gmail.com`
   - Password: `123456`
5. Sau khi đăng ký thành công, đăng nhập lại

### 4.2 Test Xem Danh Sách Đấu Giá
1. Click vào menu **Đấu giá** trên Header
2. Bạn sẽ thấy danh sách phiên đấu giá (nếu đã thêm dữ liệu mẫu)

### 4.3 Test Đặt Giá Realtime
1. Click vào một phiên đấu giá bất kỳ
2. Đăng nhập nếu chưa đăng nhập
3. Nhập giá cao hơn giá hiện tại
4. Click **Đặt giá thầu**
5. Lịch sử đấu giá sẽ cập nhật **REALTIME** (mở 2 tab để test)

---

## 📁 CẤU TRÚC DỰ ÁN

```
QuanLyDauGia/
├── auction-backend/
│   ├── server.js           # Express + Socket.IO server
│   ├── package.json
│   └── node_modules/
├── auction-frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx             # Trang chủ
│   │   │   ├── Login.jsx            # Đăng nhập/Đăng ký
│   │   │   ├── AuctionList.jsx      # Danh sách đấu giá
│   │   │   ├── AuctionDetail.jsx    # Chi tiết + Đặt giá realtime
│   │   │   ├── UserDashboard.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Quản lý Authentication
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── node_modules/
└── HUONG_DAN_CHAY.md
```

---

## 🔌 API ENDPOINTS

### Authentication
- `POST /register` - Đăng ký tài khoản mới
- `POST /login` - Đăng nhập

### Auctions
- `GET /auctions?status=active&page=1&limit=10` - Lấy danh sách đấu giá
- `GET /auctions/:id` - Lấy chi tiết phiên đấu giá
- `POST /auctions` - Tạo phiên đấu giá mới (Admin/Seller)

### Realtime (Socket.IO)
- `join_auction` - Join vào phòng đấu giá
- `send_bid` - Gửi giá đặt mới
- `receive_bid` - Nhận giá đặt realtime

---

## 🎯 TÍNH NĂNG ĐÃ HOÀN THÀNH

✅ **Backend:**
- Kết nối SQL Server (Windows Auth)
- API Đăng ký/Đăng nhập với SHA-256
- API CRUD phiên đấu giá
- Realtime bidding với Socket.IO

✅ **Frontend:**
- Giao diện hiện đại với Tailwind CSS
- Authentication context với localStorage
- Trang đăng nhập/đăng ký có validation
- Danh sách đấu giá fetch từ API
- Chi tiết đấu giá + Đặt giá realtime
- Đếm ngược thời gian tự động
- Responsive design

---

## ⚠️ LƯU Ý QUAN TRỌNG

1. **Backend phải chạy trước Frontend**
2. **SQL Server phải bật và cho phép Windows Authentication**
3. **Port 3001** (backend) và **5173** (frontend) phải trống
4. Nếu lỗi kết nối database:
   - Kiểm tra lại tên server trong `server.js`
   - Đảm bảo SQL Server đã bật
   - Kiểm tra Windows Authentication đã được enable

---

## 📞 HỖ TRỢ

Nếu gặp lỗi, kiểm tra:
1. Console log của Backend (Terminal chạy `node server.js`)
2. Console log của Frontend (F12 trong trình duyệt)
3. Network tab để xem request/response

---

## 🔥 CÁC BƯỚC TIẾP THEO (Tùy chọn)

- [ ] Thêm payment gateway
- [ ] Email notification khi thắng đấu giá
- [ ] Tích hợp upload ảnh (Cloudinary/AWS S3)
- [ ] Admin dashboard để quản lý users
- [ ] Fraud detection system
- [ ] Mobile app (React Native)

---

**Chúc bạn phát triển thành công! 🎉**
