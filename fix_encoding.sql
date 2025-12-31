-- ===================================
-- FIX ENCODING - CHẠY TRONG SSMS
-- ===================================
-- Copy toàn bộ script này và paste vào SQL Server Management Studio
-- Sau đó nhấn F5 để execute

USE auction_system;
GO

-- Xóa dữ liệu cũ
DELETE FROM Notifications;
DELETE FROM Bids;
DELETE FROM AuctionParticipants;
DELETE FROM Auctions;
DELETE FROM Products;
DELETE FROM Categories;
DELETE FROM Newsletter;
DELETE FROM Users WHERE user_id > 0;
GO

-- Reset identity
DBCC CHECKIDENT ('Users', RESEED, 0);
DBCC CHECKIDENT ('Categories', RESEED, 0);
DBCC CHECKIDENT ('Products', RESEED, 0);
DBCC CHECKIDENT ('Auctions', RESEED, 0);
DBCC CHECKIDENT ('Bids', RESEED, 0);
DBCC CHECKIDENT ('Notifications', RESEED, 0);
GO

-- Insert Users
INSERT INTO Users (username, password, email, full_name, phone_number, role_id, trust_score) VALUES
('admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin@auction.com', N'Quản Trị Viên', '0901234567', 1, 100),
('user1', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'user1@gmail.com', N'Nguyễn Văn A', '0912345678', 2, 95),
('user2', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'user2@gmail.com', N'Trần Thị B', '0923456789', 2, 88),
('user3', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'user3@gmail.com', N'Lê Văn C', '0934567890', 2, 92),
('user4', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'user4@gmail.com', N'Phạm Thị D', '0945678901', 2, 85),
('seller1', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'seller1@gmail.com', N'Hoàng Văn E', '0956789012', 2, 98);
GO

-- Insert Categories
SET IDENTITY_INSERT Categories ON;
INSERT INTO Categories (category_id, category_name, description) VALUES
(1, N'Điện thoại', N'Điện thoại di động các loại'),
(2, N'Laptop', N'Máy tính xách tay'),
(3, N'Xe máy', N'Xe máy các hãng'),
(4, N'Đồng hồ', N'Đồng hồ cao cấp'),
(5, N'Túi xách', N'Túi xách thời trang'),
(6, N'Giày dép', N'Giày sneaker, boots'),
(7, N'Nghệ thuật', N'Tranh, tác phẩm nghệ thuật'),
(8, N'Đồ cổ', N'Đồ cổ, sưu tầm'),
(9, N'Ô tô', N'Ô tô các loại'),
(10, N'Bất động sản', N'Nhà đất, căn hộ');
SET IDENTITY_INSERT Categories OFF;
GO

-- Insert Products
SET IDENTITY_INSERT Products ON;
INSERT INTO Products (product_id, product_name, description, image_url, category_id, seller_id, starting_price, current_price) VALUES
(1, N'iPhone 15 Pro Max 256GB', N'iPhone 15 Pro Max màu Titan Tự Nhiên, 256GB, nguyên seal chưa kích hoạt. Đầy đủ phụ kiện chính hãng Apple.', 
'https://cdn.hoanghamobile.com/i/preview/Uploads/2023/09/13/iphone-15-pro-max-white-titanium-pure-back-iphone-15-pro-max-white-titanium-pure-front-2up-screen-usen.png', 1, 6, 25000000, 25000000),

(2, N'Samsung Galaxy S24 Ultra 512GB', N'Samsung S24 Ultra màu Titan Black, 512GB, máy mới 100%, bảo hành 12 tháng chính hãng.', 
'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800', 1, 6, 28000000, 28000000),

(3, N'Xiaomi 14 Ultra 16GB/512GB', N'Xiaomi 14 Ultra camera Leica, RAM 16GB, ROM 512GB. Máy đẹp như mới, còn bảo hành 10 tháng.', 
'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800', 1, 2, 18000000, 18000000),

(4, N'MacBook Pro 16" M3 Max', N'MacBook Pro 16 inch chip M3 Max, RAM 32GB, SSD 1TB. Màu Space Black, mới 99%, dùng 2 tháng.', 
'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800', 2, 6, 45000000, 45000000),

(5, N'Dell XPS 15 9530', N'Dell XPS 15, Core i9-13900H, RTX 4070, RAM 32GB, SSD 1TB. Màn hình OLED 4K, máy đẹp 98%.', 
'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800', 2, 2, 32000000, 32000000),

(6, N'ASUS ROG Zephyrus G14', N'ASUS ROG G14, AMD Ryzen 9, RTX 4060, RAM 16GB. Laptop gaming mỏng nhẹ, pin khủng 10 giờ.', 
'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800', 2, 3, 28000000, 28000000),

(7, N'Honda SH 350i 2024', N'Honda SH 350i màu đen, đời 2024, mới chạy 1500km. Xe đẹp như mới, chính chủ bán.', 
'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800', 3, 3, 95000000, 95000000),

(8, N'Yamaha NVX 155 VVA', N'Yamaha NVX 155 VVA, màu xám titan, độ pô Akrapovic, dàn áo carbon. Xe nguyên zin, đẹp xuất sắc.', 
'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800', 3, 4, 38000000, 38000000),

(9, N'Rolex Submariner Date 126610LN', N'Rolex Submariner Date thép đen, size 41mm, máy 3235. Fullbox, còn bảo hành 3 năm.', 
'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800', 4, 5, 180000000, 180000000),

(10, N'Omega Speedmaster Moonwatch', N'Omega Speedmaster Professional Moonwatch, máy cơ 1861. Fullbox, giấy tờ đầy đủ.', 
'https://images.unsplash.com/photo-1587836374228-4c84646d6458?w=800', 4, 5, 85000000, 85000000),

(11, N'Louis Vuitton Neverfull MM', N'LV Neverfull MM size vừa, họa tiết Monogram. Fullbox, authentic 100%, mới 99%.', 
'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800', 5, 4, 25000000, 25000000),

(12, N'Hermès Birkin 30 Togo', N'Hermès Birkin 30 da Togo màu Gold, phụ kiện vàng. Fullbox, chính hãng, còn tem.', 
'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800', 5, 5, 450000000, 450000000),

(13, N'Nike Air Jordan 1 Retro High OG', N'Jordan 1 High Travis Scott x Fragment, size 42, new 100%, chưa qua sử dụng. Fullbox, hóa đơn.', 
'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', 6, 3, 45000000, 45000000),

(14, N'Adidas Yeezy Boost 350 V2', N'Yeezy 350 V2 Zebra, size 43, auth 100%. Mới 95%, đi 3 lần, không box.', 
'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800', 6, 4, 8000000, 8000000),

(15, N'Tranh sơn dầu phong cảnh Sapa', N'Tranh sơn dầu vẽ tay phong cảnh ruộng bậc thang Sapa, kích thước 80x120cm. Tác phẩm độc bản.', 
'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800', 7, 5, 50000000, 50000000),

(16, N'Mercedes-Benz C200 2023', N'Mercedes C200 Exclusive 2023, màu trắng, ODO 8000km. Xe chính chủ, không lỗi nhỏ.', 
'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800', 9, 6, 1500000000, 1500000000),

(17, N'BMW 320i Sport Line 2022', N'BMW 320i Sport Line 2022, màu đen, ODO 15000km. Full option, bảo dưỡng định kỳ.', 
'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800', 9, 5, 1200000000, 1200000000),

(18, N'Căn hộ Vinhomes Central Park 3PN', N'Căn hộ 3 phòng ngủ, 100m2, tầng cao view Landmark 81. Full nội thất cao cấp.', 
'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800', 10, 6, 5000000000, 5000000000),

(19, N'Nhà phố Thảo Điền 5x20m', N'Nhà phố khu Thảo Điền, 5x20m, 3 lầu. Thiết kế hiện đại, full nội thất.', 
'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', 10, 5, 15000000000, 15000000000),

(20, N'iPhone 14 Pro 256GB', N'iPhone 14 Pro màu Deep Purple, 256GB, máy đẹp 98%, pin 92%. Đầy đủ hộp phụ kiện.', 
'https://images.unsplash.com/photo-1678652197950-ed09a8c78d52?w=800', 1, 3, 15000000, 15000000);
SET IDENTITY_INSERT Products OFF;
GO

-- Insert Auctions
SET IDENTITY_INSERT Auctions ON;
INSERT INTO Auctions (auction_id, product_id, current_price, start_time, end_time, status, total_bids, view_count, highest_bidder_id) VALUES
(1, 1, 28500000, DATEADD(HOUR, -2, GETDATE()), DATEADD(DAY, 2, GETDATE()), 'ACTIVE', 8, 145, 2),
(2, 2, 30000000, DATEADD(HOUR, -5, GETDATE()), DATEADD(DAY, 3, GETDATE()), 'ACTIVE', 12, 203, 3),
(3, 4, 48000000, DATEADD(HOUR, -1, GETDATE()), DATEADD(DAY, 1, GETDATE()), 'ACTIVE', 6, 89, 4),
(4, 7, 98000000, DATEADD(HOUR, -3, GETDATE()), DATEADD(HOUR, 18, GETDATE()), 'ACTIVE', 15, 267, 2),
(5, 9, 195000000, DATEADD(HOUR, -4, GETDATE()), DATEADD(DAY, 5, GETDATE()), 'ACTIVE', 23, 412, 5),
(6, 13, 52000000, DATEADD(HOUR, -6, GETDATE()), DATEADD(DAY, 2, GETDATE()), 'ACTIVE', 18, 301, 3),
(7, 3, 18000000, DATEADD(DAY, 1, GETDATE()), DATEADD(DAY, 4, GETDATE()), 'PENDING', 0, 45, NULL),
(8, 5, 32000000, DATEADD(HOUR, 12, GETDATE()), DATEADD(DAY, 3, GETDATE()), 'PENDING', 0, 67, NULL),
(9, 11, 25000000, DATEADD(DAY, 2, GETDATE()), DATEADD(DAY, 5, GETDATE()), 'PENDING', 0, 23, NULL),
(10, 20, 18500000, DATEADD(DAY, -5, GETDATE()), DATEADD(DAY, -2, GETDATE()), 'COMPLETED', 14, 178, 2),
(11, 6, 32000000, DATEADD(DAY, -7, GETDATE()), DATEADD(DAY, -3, GETDATE()), 'COMPLETED', 19, 234, 4),
(12, 8, 42000000, DATEADD(DAY, -10, GETDATE()), DATEADD(DAY, -6, GETDATE()), 'COMPLETED', 22, 189, 3),
(13, 10, 92000000, DATEADD(DAY, -8, GETDATE()), DATEADD(DAY, -4, GETDATE()), 'COMPLETED', 17, 156, 5),
(14, 14, 9500000, DATEADD(DAY, -6, GETDATE()), DATEADD(DAY, -2, GETDATE()), 'COMPLETED', 11, 123, 2),
(15, 15, 50000000, DATEADD(DAY, -3, GETDATE()), DATEADD(DAY, -1, GETDATE()), 'CANCELLED', 0, 34, NULL);
SET IDENTITY_INSERT Auctions OFF;
GO

-- Insert Bids
SET IDENTITY_INSERT Bids ON;
INSERT INTO Bids (bid_id, auction_id, bidder_id, bid_amount, bid_time) VALUES
(1, 1, 2, 25500000, DATEADD(HOUR, -2, GETDATE())),
(2, 1, 3, 26000000, DATEADD(MINUTE, -110, GETDATE())),
(3, 1, 4, 26500000, DATEADD(MINUTE, -105, GETDATE())),
(4, 1, 2, 27000000, DATEADD(MINUTE, -95, GETDATE())),
(5, 1, 3, 27500000, DATEADD(MINUTE, -80, GETDATE())),
(6, 1, 5, 28000000, DATEADD(MINUTE, -65, GETDATE())),
(7, 1, 4, 28200000, DATEADD(MINUTE, -50, GETDATE())),
(8, 1, 2, 28500000, DATEADD(MINUTE, -30, GETDATE())),
(9, 2, 2, 28500000, DATEADD(HOUR, -5, GETDATE())),
(10, 2, 4, 29000000, DATEADD(HOUR, -4, GETDATE())),
(11, 2, 3, 29500000, DATEADD(HOUR, -3, GETDATE())),
(12, 2, 5, 30000000, DATEADD(HOUR, -2, GETDATE())),
(13, 3, 2, 46000000, DATEADD(MINUTE, -55, GETDATE())),
(14, 3, 3, 47000000, DATEADD(MINUTE, -45, GETDATE())),
(15, 3, 4, 48000000, DATEADD(MINUTE, -30, GETDATE())),
(16, 4, 3, 96000000, DATEADD(HOUR, -3, GETDATE())),
(17, 4, 4, 97000000, DATEADD(HOUR, -2, GETDATE())),
(18, 4, 2, 98000000, DATEADD(HOUR, -1, GETDATE())),
(19, 5, 2, 185000000, DATEADD(HOUR, -4, GETDATE())),
(20, 5, 3, 190000000, DATEADD(HOUR, -3, GETDATE())),
(21, 5, 4, 195000000, DATEADD(HOUR, -2, GETDATE())),
(22, 10, 3, 15500000, DATEADD(DAY, -5, GETDATE())),
(23, 10, 4, 16000000, DATEADD(DAY, -4, GETDATE())),
(24, 10, 2, 16500000, DATEADD(DAY, -3, GETDATE())),
(25, 10, 5, 17000000, DATEADD(DAY, -3, GETDATE())),
(26, 10, 3, 17500000, DATEADD(DAY, -2, GETDATE())),
(27, 10, 2, 18500000, DATEADD(DAY, -2, GETDATE())),
(28, 11, 2, 29000000, DATEADD(DAY, -7, GETDATE())),
(29, 11, 3, 30000000, DATEADD(DAY, -6, GETDATE())),
(30, 11, 4, 32000000, DATEADD(DAY, -5, GETDATE()));
SET IDENTITY_INSERT Bids OFF;
GO

-- Insert Notifications
SET IDENTITY_INSERT Notifications ON;
INSERT INTO Notifications (notification_id, user_id, title, message, notification_type, is_read, auction_id, created_at) VALUES
(1, 2, N'Bạn đã bị vượt giá!', N'Có người đã đặt giá cao hơn bạn trong phiên đấu giá iPhone 15 Pro Max', 'outbid', 0, 1, DATEADD(MINUTE, -30, GETDATE())),
(2, 2, N'Chúc mừng! Bạn đã thắng đấu giá', N'Bạn đã thắng phiên đấu giá "iPhone 14 Pro 256GB"', 'won', 1, 10, DATEADD(DAY, -2, GETDATE())),
(3, 2, N'Phiên đấu giá sắp kết thúc', N'Phiên đấu giá "Honda SH 350i" sẽ kết thúc trong 1 giờ nữa', 'info', 0, 4, DATEADD(MINUTE, -20, GETDATE())),
(4, 3, N'Bạn đã bị vượt giá!', N'Có người đã đặt giá cao hơn bạn trong phiên đấu giá Samsung Galaxy S24 Ultra', 'outbid', 0, 2, DATEADD(HOUR, -2, GETDATE())),
(5, 3, N'Bạn đã bị vượt giá!', N'Có người đã đặt giá cao hơn bạn trong phiên đấu giá MacBook Pro M3', 'outbid', 1, 3, DATEADD(MINUTE, -45, GETDATE())),
(6, 4, N'Chúc mừng! Bạn đã thắng đấu giá', N'Bạn đã thắng phiên đấu giá "ASUS ROG Zephyrus G14"', 'won', 1, 11, DATEADD(DAY, -3, GETDATE())),
(7, 4, N'Bạn đã bị vượt giá!', N'Có người đã đặt giá cao hơn bạn trong phiên đấu giá iPhone 15 Pro Max', 'outbid', 1, 1, DATEADD(MINUTE, -50, GETDATE()));
SET IDENTITY_INSERT Notifications OFF;
GO

-- Insert Newsletter
INSERT INTO Newsletter (email) VALUES
('newsletter1@gmail.com'),
('newsletter2@gmail.com'),
('newsletter3@outlook.com'),
('newsletter4@yahoo.com'),
('newsletter5@gmail.com');
GO

-- Insert AuctionParticipants
INSERT INTO AuctionParticipants (auction_id, user_id, registered_at) VALUES
(1, 2, DATEADD(HOUR, -2, GETDATE())),
(1, 3, DATEADD(MINUTE, -110, GETDATE())),
(1, 4, DATEADD(MINUTE, -105, GETDATE())),
(1, 5, DATEADD(MINUTE, -65, GETDATE())),
(2, 2, DATEADD(HOUR, -5, GETDATE())),
(2, 3, DATEADD(HOUR, -3, GETDATE())),
(2, 4, DATEADD(HOUR, -4, GETDATE())),
(2, 5, DATEADD(HOUR, -2, GETDATE())),
(3, 2, DATEADD(MINUTE, -55, GETDATE())),
(3, 3, DATEADD(MINUTE, -45, GETDATE())),
(3, 4, DATEADD(MINUTE, -30, GETDATE())),
(4, 2, DATEADD(HOUR, -1, GETDATE())),
(4, 3, DATEADD(HOUR, -3, GETDATE())),
(4, 4, DATEADD(HOUR, -2, GETDATE())),
(5, 2, DATEADD(HOUR, -4, GETDATE())),
(5, 3, DATEADD(HOUR, -3, GETDATE())),
(5, 4, DATEADD(HOUR, -2, GETDATE()));
GO

PRINT N'✅ Import thành công!';
PRINT N'Đăng nhập: admin / admin123 hoặc user1 / admin123';
GO
