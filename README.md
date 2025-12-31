# 🏛️ HỆ THỐNG ĐẤU GIÁ TRỰC TUYẾN

## 📋 Mục Lục
- [Giới Thiệu](#giới-thiệu)
- [Tính Năng Chính](#tính-năng-chính)
- [Công Nghệ Sử Dụng](#công-nghệ-sử-dụng)
- [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
- [Cài Đặt](#cài-đặt)
- [Cấu Trúc Dự Án](#cấu-trúc-dự-án)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Hướng Dẫn Sử Dụng](#hướng-dẫn-sử-dụng)
- [Tài Khoản Demo](#tài-khoản-demo)
- [Ghi Chú](#ghi-chú)

---

## 🎯 Giới Thiệu

**Hệ Thống Đấu Giá Trực Tuyến** là một nền tảng đấu giá hiện đại, cho phép người dùng tham gia đấu giá các sản phẩm một cách dễ dàng và minh bạch. Hệ thống cung cấp giao diện trực quan, đấu giá real-time với WebSocket, và quản lý toàn diện cho cả người dùng và quản trị viên.

### 🌟 Điểm Nổi Bật
- ⚡ **Real-time Bidding**: Đặt giá và cập nhật tức thời với Socket.IO
- 🔒 **Phê Duyệt Phiên**: Admin kiểm duyệt trước khi lên sàn
- 📊 **Dashboard Thống Kê**: Biểu đồ trực quan với Recharts
- 💝 **Watchlist**: Theo dõi phiên đấu giá yêu thích
- 👁️ **View Tracking**: Đếm lượt xem tự động
- 📱 **Responsive**: Tương thích mọi thiết bị
- 🎨 **UI/UX Hiện Đại**: Thiết kế dark mode với Tailwind CSS

---

## ✨ Tính Năng Chính

### 👥 Dành Cho Người Dùng
1. **Đăng Nhập/Đăng Ký**
   - Xác thực an toàn với SHA-256
   - Quản lý phiên với localStorage
   - Phân quyền User/Admin

2. **Tham Gia Đấu Giá**
   - Xem danh sách phiên đấu giá (đã lọc theo trạng thái)
   - Tìm kiếm phiên theo từ khóa, category
   - Đặt giá real-time với validation:
     - Bước giá tối thiểu: 1% giá khởi điểm
     - Bước giá tối đa: 10% giá khởi điểm
     - Không thể tự đấu giá với chính mình
   - Xem lịch sử đặt giá của phiên

3. **Quản Lý Cá Nhân**
   - Dashboard thống kê cá nhân
   - Xem phiên đang tham gia
   - Quản lý phiên đấu giá của mình:
     - Tạo phiên mới (chờ admin duyệt)
     - Chỉnh sửa khi chưa có lượt đấu
     - Xóa phiên PENDING
     - Không thể xóa phiên ACTIVE
   - Xem lịch sử đặt giá của mình

4. **Watchlist (Danh Sách Theo Dõi)**
   - Thêm/xóa phiên yêu thích
   - Biểu tượng tim đỏ khi đã thêm
   - Quản lý tập trung tại trang Watchlist

5. **Chat/Nhắn Tin**
   - Liên hệ với người bán
   - Liên hệ với người thắng đấu giá

### 👨‍💼 Dành Cho Admin
1. **Dashboard Quản Trị**
   - Thống kê tổng quan:
     - Phiên đang diễn ra
     - Phiên đang chờ lên sàn
     - Phiên chờ duyệt
     - Tổng giá trị giao dịch
   - Biểu đồ doanh thu theo tháng (Bar Chart)
   - Danh mục phổ biến
   - Hoạt động gần đây
   - Cảnh báo hệ thống

2. **Quản Lý Phiên Đấu Giá**
   - Duyệt/Từ chối phiên PENDING
   - Xem danh sách theo trạng thái:
     - Tất cả
     - Chờ duyệt
     - Đang chờ lên sàn
     - Đang diễn ra
     - Đã kết thúc
     - Đã hủy
   - Xóa phiên (chỉ PENDING)
   - Chỉnh sửa thông tin

3. **Quản Lý Người Dùng**
   - Xem danh sách users
   - Tìm kiếm, lọc theo role
   - Khóa/mở khóa tài khoản

4. **Quản Lý Gian Lận**
   - Xem báo cáo gian lận
   - Đánh giá mức độ (Cao/Trung bình/Thấp)
   - Xử lý khiếu nại

### 🔄 Workflow Phiên Đấu Giá
```
1. User tạo phiên → Status: PENDING
2. Admin duyệt → Status: ACTIVE (chưa đến start_time)
3. Đến start_time → Phiên bắt đầu (có thể đặt giá)
4. Đến end_time → Status: COMPLETED
```

### 🎨 Trạng Thái Phiên Đấu Giá
- **PENDING**: Chờ admin duyệt (màu vàng)
- **ACTIVE (chưa bắt đầu)**: Đang chờ lên sàn (màu xanh dương)
- **ACTIVE (đang diễn ra)**: Đang đấu giá (màu xanh lá)
- **COMPLETED**: Đã kết thúc (màu xám)
- **CANCELLED**: Đã hủy (màu đỏ)

---

## 🛠️ Công Nghệ Sử Dụng

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 5.x
- **Database**: SQL Server (BAOLDZ)
- **Real-time**: Socket.IO 4.8
- **File Upload**: Multer 2.0
- **CORS**: cors 2.8

### Frontend
- **Framework**: React 19.2
- **Build Tool**: Vite 7.x
- **Routing**: React Router DOM 7.11
- **Styling**: Tailwind CSS 3.4
- **Icons**: Material Symbols (Google Fonts)
- **Charts**: Recharts 3.6
- **Real-time**: Socket.IO Client 4.8

### Database
- **DBMS**: SQL Server
- **Collation**: Vietnamese_CI_AS (hỗ trợ tiếng Việt)
- **Tools**: SQL Server Management Studio (SSMS)

---

## 💻 Yêu Cầu Hệ Thống

### Bắt Buộc
- **Node.js**: >= 18.x
- **npm**: >= 9.x
- **SQL Server**: 2014 hoặc mới hơn
- **Trình duyệt**: Chrome, Firefox, Edge (phiên bản mới nhất)

### Khuyến Nghị
- **RAM**: >= 8GB
- **Disk**: >= 500MB trống
- **OS**: Windows 10/11, macOS 10.15+, Ubuntu 20.04+

---

## 🚀 Cài Đặt

### Bước 1: Clone Repository
```bash
cd Desktop
git clone <repository-url> QuanLyDauGia
cd QuanLyDauGia
```

### Bước 2: Cài Đặt Database
1. Mở SQL Server Management Studio (SSMS)
2. Kết nối với server: `BAOLDZ`
3. Tạo database mới: `AuctionDB`
4. Chạy các file SQL theo thứ tự:
   ```sql
   -- File 1: Tạo bảng và schema
   database_schema_complete.sql
   
   -- File 2: Sửa encoding tiếng Việt
   fix_encoding.sql
   
   -- File 3: Thêm messaging system
   add_messaging_system.sql
   
   -- File 4: Thêm watchlist và avatar
   add_watchlist_avatar.sql
   
   -- File 5: Dữ liệu mẫu (tùy chọn)
   sample_data.sql
   ```

### Bước 3: Cấu Hình Backend
```bash
cd auction-backend
npm install
```

Kiểm tra file `server.js` dòng ~7-15:
```javascript
const config = {
    server: 'BAOLDZ',        // Tên SQL Server của bạn
    database: 'AuctionDB',   // Tên database
    options: {
        trustedConnection: true,
        trustServerCertificate: true
    }
};
```

### Bước 4: Cấu Hình Frontend
```bash
cd ../auction-frontend
npm install
```

### Bước 5: Chạy Ứng Dụng

**Terminal 1 - Backend:**
```bash
cd auction-backend
node server.js
```
✅ Server chạy tại: `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd auction-frontend
npm run dev
```
✅ Client chạy tại: `http://localhost:5173`

### Bước 6: Truy Cập Ứng Dụng
Mở trình duyệt và truy cập: **http://localhost:5173**

---

## 📁 Cấu Trúc Dự Án

```
QuanLyDauGia/
├── auction-backend/           # Backend Node.js
│   ├── server.js             # Entry point, REST API + Socket.IO
│   ├── uploads/              # Thư mục upload ảnh
│   └── package.json
│
├── auction-frontend/          # Frontend React
│   ├── src/
│   │   ├── main.jsx          # Entry point
│   │   ├── App.jsx           # Root component
│   │   ├── index.css         # Global styles
│   │   ├── components/       # Reusable components
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── WatchlistButton.jsx
│   │   ├── context/          # React Context
│   │   │   └── AuthContext.jsx
│   │   └── pages/            # Page components
│   │       ├── Home.jsx
│   │       ├── Login.jsx
│   │       ├── Register.jsx
│   │       ├── AuctionList.jsx
│   │       ├── AuctionDetail.jsx
│   │       ├── CreateAuction.jsx
│   │       ├── EditAuction.jsx
│   │       ├── MyAuctions.jsx
│   │       ├── MyBids.jsx
│   │       ├── Watchlist.jsx
│   │       ├── UserDashboard.jsx
│   │       ├── AdminDashboard.jsx
│   │       ├── UserProfile.jsx
│   │       ├── Messages.jsx
│   │       ├── BidHistory.jsx
│   │       └── ForgotPassword.jsx
│   ├── public/
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── database_schema_complete.sql    # Schema database
├── fix_encoding.sql                # Fix tiếng Việt
├── add_messaging_system.sql        # Thêm chat
├── add_watchlist_avatar.sql        # Thêm watchlist
├── sample_data.sql                 # Dữ liệu mẫu
├── DANH_SACH_CHUC_NANG.md         # Danh sách tính năng
├── HUONG_DAN_CHAY.md              # Hướng dẫn chạy
├── HUONG_DAN_DEMO_CHI_TIET.md     # Hướng dẫn demo
└── README.md                       # File này
```

---

## 🗄️ Database Schema

### Bảng Chính

#### 1. Users (Người Dùng)
```sql
CREATE TABLE Users (
    user_id INT PRIMARY KEY IDENTITY(1,1),
    username NVARCHAR(50) UNIQUE NOT NULL,
    password NVARCHAR(255) NOT NULL,
    email NVARCHAR(100),
    full_name NVARCHAR(100),
    phone_number NVARCHAR(20),
    avatar_url NVARCHAR(500),
    address NVARCHAR(255),
    role_id INT DEFAULT 2,          -- 1: Admin, 2: User
    created_at DATETIME DEFAULT GETDATE(),
    last_login_at DATETIME
);
```

#### 2. Categories (Danh Mục)
```sql
CREATE TABLE Categories (
    category_id INT PRIMARY KEY IDENTITY(1,1),
    category_name NVARCHAR(100) NOT NULL,
    description NVARCHAR(500),
    parent_category_id INT
);
```

#### 3. Products (Sản Phẩm)
```sql
CREATE TABLE Products (
    product_id INT PRIMARY KEY IDENTITY(1,1),
    product_name NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX),
    category_id INT,
    starting_price DECIMAL(18,2) NOT NULL,
    image_url NVARCHAR(500),
    seller_id INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (category_id) REFERENCES Categories(category_id),
    FOREIGN KEY (seller_id) REFERENCES Users(user_id)
);
```

#### 4. Auctions (Phiên Đấu Giá)
```sql
CREATE TABLE Auctions (
    auction_id INT PRIMARY KEY IDENTITY(1,1),
    product_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status NVARCHAR(20) DEFAULT 'PENDING',  -- PENDING, ACTIVE, COMPLETED, CANCELLED
    current_price DECIMAL(18,2),
    highest_bidder_id INT,
    total_bids INT DEFAULT 0,
    view_count INT DEFAULT 0,
    min_bid_increment DECIMAL(18,2) DEFAULT 100000,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (highest_bidder_id) REFERENCES Users(user_id)
);
```

#### 5. Bids (Lượt Đặt Giá)
```sql
CREATE TABLE Bids (
    bid_id INT PRIMARY KEY IDENTITY(1,1),
    auction_id INT NOT NULL,
    bidder_id INT NOT NULL,
    bid_amount DECIMAL(18,2) NOT NULL,
    bid_time DATETIME DEFAULT GETDATE(),
    is_valid BIT DEFAULT 1,
    FOREIGN KEY (auction_id) REFERENCES Auctions(auction_id) ON DELETE CASCADE,
    FOREIGN KEY (bidder_id) REFERENCES Users(user_id)
);
```

#### 6. Watchlist (Danh Sách Theo Dõi)
```sql
CREATE TABLE Watchlist (
    watchlist_id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    auction_id INT NOT NULL,
    added_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (auction_id) REFERENCES Auctions(auction_id) ON DELETE CASCADE
);
```

#### 7. Messages (Tin Nhắn)
```sql
CREATE TABLE Messages (
    message_id INT PRIMARY KEY IDENTITY(1,1),
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    message_text NVARCHAR(MAX) NOT NULL,
    sent_at DATETIME DEFAULT GETDATE(),
    is_read BIT DEFAULT 0,
    auction_id INT,
    FOREIGN KEY (sender_id) REFERENCES Users(user_id),
    FOREIGN KEY (receiver_id) REFERENCES Users(user_id),
    FOREIGN KEY (auction_id) REFERENCES Auctions(auction_id)
);
```

#### 8. FraudReports (Báo Cáo Gian Lận)
```sql
CREATE TABLE FraudReports (
    report_id INT PRIMARY KEY IDENTITY(1,1),
    auction_id INT NOT NULL,
    reporter_id INT NOT NULL,
    reported_user_id INT NOT NULL,
    report_reason NVARCHAR(MAX),
    report_time DATETIME DEFAULT GETDATE(),
    status NVARCHAR(20) DEFAULT 'PENDING',
    severity NVARCHAR(20) DEFAULT 'Thấp',  -- Cao, Trung bình, Thấp
    FOREIGN KEY (auction_id) REFERENCES Auctions(auction_id),
    FOREIGN KEY (reporter_id) REFERENCES Users(user_id),
    FOREIGN KEY (reported_user_id) REFERENCES Users(user_id)
);
```

---

## 🔌 API Endpoints

### Authentication
- `POST /login` - Đăng nhập
- `POST /register` - Đăng ký tài khoản

### Auctions
- `GET /auctions` - Lấy danh sách phiên đấu giá
  - Query: `?status=active&category=Đồng hồ&page=1&limit=10`
- `GET /auctions/:id` - Chi tiết phiên đấu giá
- `POST /auctions` - Tạo phiên mới (User)
- `PUT /auctions/:id` - Cập nhật phiên
- `DELETE /auctions/:id` - Xóa phiên
- `PUT /auction/:id/cancel` - Hủy phiên

### Admin
- `GET /admin/stats` - Thống kê tổng quan
- `GET /admin/auctions` - Danh sách phiên (admin)
- `PUT /admin/auctions/:id/approve` - Duyệt phiên
- `PUT /admin/auctions/:id/reject` - Từ chối phiên
- `GET /admin/users` - Danh sách users
- `GET /admin/fraud-reports` - Báo cáo gian lận
- `GET /admin/recent-activities` - Hoạt động gần đây
- `GET /admin/alerts` - Cảnh báo hệ thống

### User
- `GET /user/:userId/dashboard` - Dashboard cá nhân
- `GET /user/:userId/selling-auctions` - Phiên đang bán
  - Query: `?status=PENDING|WAITING|ACTIVE|COMPLETED|CANCELLED`
- `GET /user/:userId/bidding-auctions` - Phiên đang tham gia
- `GET /user/:userId/bid-history` - Lịch sử đặt giá
- `GET /user/:userId/watchlist` - Danh sách theo dõi
- `POST /user/:userId/watchlist/:auctionId` - Thêm watchlist
- `DELETE /user/:userId/watchlist/:auctionId` - Xóa watchlist
- `GET /user/:userId/watchlist/check/:auctionId` - Kiểm tra watchlist
- `PUT /user/:userId/profile` - Cập nhật profile

### Bids
- `POST /bids` - Đặt giá
- `GET /bids/auction/:auctionId` - Lịch sử đặt giá của phiên

### Categories
- `GET /categories` - Danh sách danh mục

### Search & Stats
- `GET /search` - Tìm kiếm
  - Query: `?q=keyword&category=Xe cộ`
- `GET /stats` - Thống kê công khai (home page)

### Upload
- `POST /upload/avatar` - Upload avatar (multipart/form-data)

### Messages
- `GET /user/:userId/messages` - Danh sách tin nhắn
- `GET /messages/conversation/:userId1/:userId2` - Cuộc hội thoại
- `POST /messages/send` - Gửi tin nhắn
- `PUT /messages/:messageId/read` - Đánh dấu đã đọc

---

## 🎮 Hướng Dẫn Sử Dụng

### Người Dùng Thông Thường

#### 1. Đăng Ký/Đăng Nhập
1. Truy cập trang chủ
2. Click "Đăng nhập" góc phải
3. Hoặc tạo tài khoản mới tại "Đăng ký"

#### 2. Tham Gia Đấu Giá
1. Vào trang "Đấu giá" từ menu
2. Lọc theo danh mục (Đồng hồ, Trang sức, Xe cộ...)
3. Click vào phiên muốn tham gia
4. Nhập giá đặt (tối thiểu +1% giá khởi điểm)
5. Click "Đặt giá ngay"
6. Theo dõi real-time khi có người đặt giá khác

#### 3. Tạo Phiên Đấu Giá
1. Vào "Dashboard" → "Tạo phiên mới"
2. Điền thông tin:
   - Tên sản phẩm
   - Mô tả chi tiết
   - Danh mục
   - Giá khởi điểm
   - Thời gian bắt đầu/kết thúc
   - Upload hình ảnh
3. Click "Tạo phiên đấu giá"
4. Chờ admin duyệt (status: PENDING)

#### 4. Quản Lý Phiên Của Mình
1. Vào "Quản lý tin đấu giá"
2. Lọc theo trạng thái
3. Với phiên PENDING:
   - Có thể chỉnh sửa
   - Có thể xóa
4. Với phiên ACTIVE (chờ lên sàn):
   - Có thể sửa nếu chưa có lượt đấu
   - Có thể hủy nếu chưa có lượt đấu
5. Với phiên ACTIVE (đang diễn ra):
   - Không thể sửa/xóa
   - Xem danh sách đặt giá
   - Liên hệ người đấu giá cao nhất

#### 5. Watchlist (Theo Dõi)
1. Ở trang chi tiết phiên, click icon ❤️
2. Icon đổi sang đỏ → Đã thêm vào watchlist
3. Xem tất cả tại "Danh sách theo dõi"
4. Click lại icon ❤️ để bỏ theo dõi

### Quản Trị Viên

#### 1. Đăng Nhập Admin
- Username: `admin`
- Password: `admin123`

#### 2. Duyệt Phiên Đấu Giá
1. Vào "Admin Dashboard"
2. Tab "Quản lý phiên đấu giá"
3. Lọc "Chờ duyệt"
4. Xem chi tiết phiên
5. Click "Duyệt" hoặc "Từ chối"

#### 3. Quản Lý Users
1. Tab "Quản lý người dùng"
2. Tìm kiếm user
3. Lọc theo role (Admin/User)
4. Khóa/mở khóa tài khoản

#### 4. Xem Thống Kê
1. Dashboard hiển thị:
   - Số phiên đang diễn ra
   - Số phiên đang chờ lên sàn
   - Số phiên chờ duyệt
   - Tổng giá trị giao dịch
2. Biểu đồ doanh thu theo tháng
3. Danh mục phổ biến
4. Hoạt động gần đây

---

## 👤 Tài Khoản Demo

### Admin
- **Username**: `admin`
- **Password**: `admin123`
- **Quyền**: Toàn quyền quản trị

### User 1
- **Username**: `nguyenvana`
- **Password**: `password123`
- **Email**: nguyen.van.a@example.com

### User 2
- **Username**: `tranthib`
- **Password**: `password123`
- **Email**: tran.thi.b@example.com

### User 3
- **Username**: `levanc`
- **Password**: `password123`
- **Email**: le.van.c@example.com

*(Tất cả users có thể đăng nhập và tạo phiên đấu giá)*

---

## 📝 Ghi Chú

### Workflow Đấu Giá
1. **Tạo phiên**: User tạo → Status `PENDING`
2. **Admin duyệt**: 
   - Approve → Status `ACTIVE`
   - Reject → Status `CANCELLED`
3. **Chờ lên sàn**: Status `ACTIVE` + `start_time > now`
   - Hiển thị countdown "Bắt đầu sau"
   - User không thể đặt giá
4. **Đang diễn ra**: Status `ACTIVE` + `start_time <= now < end_time`
   - Hiển thị countdown "Kết thúc sau"
   - User có thể đặt giá
5. **Kết thúc**: `now >= end_time` → Status `COMPLETED`

### Quy Tắc Đặt Giá
- Bước giá tối thiểu: **1% giá khởi điểm**
- Bước giá tối đa: **10% giá khởi điểm**
- Không thể tự đấu giá với chính mình
- Không thể vượt giá bản thân đang dẫn đầu

### Phân Quyền
- **Admin (role_id = 1)**:
  - Duyệt/từ chối phiên
  - Xem tất cả phiên
  - Quản lý users
  - Xem báo cáo gian lận
  - Xóa bất kỳ phiên nào (trừ ACTIVE)
  
- **User (role_id = 2)**:
  - Tạo phiên đấu giá
  - Đặt giá trên phiên của người khác
  - Sửa/xóa phiên của mình (PENDING)
  - Xem lịch sử cá nhân

### Database Notes
- **Collation**: Vietnamese_CI_AS (hỗ trợ tiếng Việt đầy đủ)
- **Cascade Delete**: Xóa auction → xóa bids, watchlist, messages liên quan
- **Indexes**: Đã tạo index cho các cột thường query (status, start_time, end_time)
- **Unicode**: Sử dụng NVARCHAR cho các trường tiếng Việt, prefix N'...' trong query

### Frontend Routes
```
/                      - Trang chủ
/login                 - Đăng nhập
/register              - Đăng ký
/auctions              - Danh sách đấu giá
/auction/:id           - Chi tiết phiên
/create-auction        - Tạo phiên mới (Protected)
/edit-auction/:id      - Sửa phiên (Protected)
/my-auctions           - Quản lý phiên của mình (Protected)
/my-bids               - Lịch sử đặt giá (Protected)
/watchlist             - Danh sách theo dõi (Protected)
/dashboard             - Dashboard user (Protected)
/admin                 - Dashboard admin (Admin only)
/profile               - Hồ sơ cá nhân (Protected)
/messages              - Tin nhắn (Protected)
/messages/:userId      - Chat với user (Protected)
/bid-history/:id       - Lịch sử đặt giá phiên (Protected)
/forgot-password       - Quên mật khẩu
```

### Socket Events
```javascript
// Client → Server
socket.emit('join_auction', auctionId);
socket.emit('send_bid', { auction_id, user_id, username, amount, bid_time });

// Server → Client
socket.on('receive_bid', (bidData) => {
  // Update UI với bid mới
});
```

### Environment Variables (Khuyến nghị)
Trong production, nên tạo file `.env`:
```
# Backend
PORT=3001
DB_SERVER=BAOLDZ
DB_NAME=AuctionDB
DB_TRUSTED_CONNECTION=true

# Frontend
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

### Security Notes
- ⚠️ **Password**: Đang hash với SHA-256, khuyến nghị dùng bcrypt trong production
- ⚠️ **JWT**: Chưa implement, dùng localStorage (không an toàn cho production)
- ⚠️ **CORS**: Đang allow tất cả origins, cần restrict trong production
- ⚠️ **SQL Injection**: Đã dùng parameterized queries (an toàn)

### Performance Optimization
- **Lazy Loading**: Chưa implement, nên thêm cho images
- **Pagination**: Đã có API, frontend chưa implement đầy đủ
- **Caching**: Chưa có, nên thêm Redis cho session
- **CDN**: Nên dùng cho static assets

### Testing
- Chưa có unit tests
- Chưa có integration tests
- Khuyến nghị: Jest + React Testing Library

---

## 🤝 Đóng Góp

Nếu bạn muốn đóng góp cho dự án:
1. Fork repository
2. Tạo branch mới: `git checkout -b feature/TenTinhNang`
3. Commit changes: `git commit -m 'Thêm tính năng XYZ'`
4. Push to branch: `git push origin feature/TenTinhNang`
5. Tạo Pull Request

---

## 📧 Liên Hệ

- **Email**: support@auction.vn
- **Hotline**: 1900-xxx-xxx
- **Website**: https://auction.vn

---

## 📄 License

Dự án này được phát hành dưới giấy phép MIT. Xem file `LICENSE` để biết thêm chi tiết.

---

## 🎓 Học Tập

Dự án này được xây dựng với mục đích học tập và nghiên cứu về:
- Kiến trúc Client-Server
- Real-time communication với WebSocket
- React Hooks và Context API
- REST API design
- SQL Server và relational database
- Tailwind CSS và responsive design

---

**Chúc bạn sử dụng hệ thống vui vẻ! 🎉**

*Nếu gặp vấn đề, vui lòng tham khảo file `HUONG_DAN_CHAY.md` hoặc `HUONG_DAN_DEMO_CHI_TIET.md`*
