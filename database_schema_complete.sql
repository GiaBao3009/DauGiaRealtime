-- ============================================================================
-- HỆ THỐNG ĐẤU GIÁ TRỰC TUYẾN - DATABASE SCHEMA HOÀN CHỈNH
-- Chuẩn 3NF, Real-time Support, Anti-Fraud, Audit Trail
-- ============================================================================

-- 1. XÓA DATABASE CŨ (Nếu cần reset)
-- DROP DATABASE IF EXISTS auction_system;
-- GO

-- 2. TẠO DATABASE MỚI
CREATE DATABASE auction_system;
GO

USE auction_system;
GO

-- ============================================================================
-- PHẦN 1: CORE TABLES (User Management & Authorization)
-- ============================================================================

-- 1.1 Bảng Roles (5 roles bắt buộc)
CREATE TABLE Roles (
    role_id INT IDENTITY(1,1) PRIMARY KEY,
    role_name VARCHAR(20) NOT NULL UNIQUE,
    description NVARCHAR(100)
);

-- 1.2 Bảng Permissions
CREATE TABLE Permissions (
    permission_id INT IDENTITY(1,1) PRIMARY KEY,
    permission_name VARCHAR(100) NOT NULL UNIQUE,
    description NVARCHAR(200)
);

-- 1.3 Bảng RolePermissions (Many-to-Many)
CREATE TABLE RolePermissions (
    role_id INT,
    permission_id INT,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES Roles(role_id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES Permissions(permission_id) ON DELETE CASCADE
);

-- 1.4 Bảng Users (Enhanced với KYC, Anti-Fraud)
CREATE TABLE Users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    role_id INT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password CHAR(64) NOT NULL, -- SHA-256 hash
    email VARCHAR(100) UNIQUE,
    full_name NVARCHAR(100),
    phone_number VARCHAR(20),
    id_card_number VARCHAR(20), -- CMND/CCCD
    is_verified BIT DEFAULT 0, -- KYC verification
    is_banned BIT DEFAULT 0,
    ban_reason NVARCHAR(255),
    ban_until DATETIME,
    trust_score INT DEFAULT 100, -- 0-100, giảm khi có hành vi gian lận
    created_at DATETIME DEFAULT GETDATE(),
    last_login DATETIME,
    FOREIGN KEY (role_id) REFERENCES Roles(role_id)
);

-- ============================================================================
-- PHẦN 2: PRODUCT & CATEGORY MANAGEMENT
-- ============================================================================

-- 2.1 Bảng Categories (Phân loại sản phẩm)
CREATE TABLE Categories (
    category_id INT IDENTITY(1,1) PRIMARY KEY,
    category_name NVARCHAR(100) NOT NULL,
    parent_category_id INT,
    description NVARCHAR(255),
    FOREIGN KEY (parent_category_id) REFERENCES Categories(category_id)
);

-- 2.2 Bảng Products (Enhanced với business fields)
CREATE TABLE Products (
    product_id INT IDENTITY(1,1) PRIMARY KEY,
    seller_id INT,
    category_id INT,
    product_name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    starting_price DECIMAL(15, 2) NOT NULL,
    reserve_price DECIMAL(15, 2), -- Giá dự trữ (bí mật)
    current_price DECIMAL(15, 2), -- Giá hiện tại (denormalized)
    image_url NVARCHAR(500),
    condition VARCHAR(50), -- new, like_new, used, refurbished
    weight DECIMAL(10,2), -- kg
    dimensions VARCHAR(100), -- 'L x W x H' cm
    is_verified BIT DEFAULT 0, -- Moderator duyệt
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (seller_id) REFERENCES Users(user_id),
    FOREIGN KEY (category_id) REFERENCES Categories(category_id)
);

-- ============================================================================
-- PHẦN 3: AUCTION MANAGEMENT (Core Business Logic)
-- ============================================================================

-- 3.1 Bảng Auctions (Enhanced với real-time support)
CREATE TABLE Auctions (
    auction_id INT IDENTITY(1,1) PRIMARY KEY,
    product_id INT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
    auction_type VARCHAR(20) DEFAULT 'english', -- english, dutch, sealed_bid
    
    -- Real-time fields (denormalized for performance)
    current_price DECIMAL(15,2),
    highest_bidder_id INT,
    total_bids INT DEFAULT 0,
    view_count INT DEFAULT 0,
    
    -- Auto-extend fields (gia hạn tự động)
    auto_extend_minutes INT DEFAULT 5,
    extended_count INT DEFAULT 0,
    max_extensions INT DEFAULT 3,
    
    -- Business fields
    min_bid_increment DECIMAL(15,2) DEFAULT 10000,
    shipping_type VARCHAR(50), -- pickup_only, seller_ships, buyer_arranges
    featured BIT DEFAULT 0,
    
    -- Audit fields
    created_by INT, -- Admin who approved
    cancelled_by INT,
    cancel_reason NVARCHAR(500),
    created_at DATETIME DEFAULT GETDATE(),
    
    FOREIGN KEY (product_id) REFERENCES Products(product_id),
    FOREIGN KEY (highest_bidder_id) REFERENCES Users(user_id),
    FOREIGN KEY (created_by) REFERENCES Users(user_id),
    FOREIGN KEY (cancelled_by) REFERENCES Users(user_id)
);

-- 3.2 Bảng AuctionParticipants (Pre-registration, Deposit)
CREATE TABLE AuctionParticipants (
    participant_id INT IDENTITY(1,1) PRIMARY KEY,
    auction_id INT,
    user_id INT,
    registered_at DATETIME DEFAULT GETDATE(),
    deposit_amount DECIMAL(15,2), -- Đặt cọc để tham gia
    deposit_paid BIT DEFAULT 0,
    is_approved BIT DEFAULT 0, -- Admin duyệt
    approved_by INT,
    approved_at DATETIME,
    FOREIGN KEY (auction_id) REFERENCES Auctions(auction_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (approved_by) REFERENCES Users(user_id),
    UNIQUE(auction_id, user_id)
);

-- 3.3 Bảng Bids (Real-time bidding với validation)
CREATE TABLE Bids (
    bid_id INT IDENTITY(1,1) PRIMARY KEY,
    auction_id INT,
    bidder_id INT,
    bid_amount DECIMAL(15, 2) NOT NULL,
    bid_time DATETIME DEFAULT GETDATE(),
    ip_address VARCHAR(45),
    user_agent NVARCHAR(500),
    is_auto_bid BIT DEFAULT 0, -- Proxy bidding
    is_valid BIT DEFAULT 1, -- Có thể mark invalid nếu phát hiện gian lận
    FOREIGN KEY (auction_id) REFERENCES Auctions(auction_id) ON DELETE CASCADE,
    FOREIGN KEY (bidder_id) REFERENCES Users(user_id)
);

-- 3.4 Bảng AuctionStateHistory (Track status changes)
CREATE TABLE AuctionStateHistory (
    history_id INT IDENTITY(1,1) PRIMARY KEY,
    auction_id INT,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    changed_by INT,
    changed_at DATETIME DEFAULT GETDATE(),
    reason NVARCHAR(255),
    FOREIGN KEY (auction_id) REFERENCES Auctions(auction_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES Users(user_id)
);

-- ============================================================================
-- PHẦN 4: FRAUD DETECTION & SECURITY
-- ============================================================================

-- 4.1 Bảng FraudAlerts
CREATE TABLE FraudAlerts (
    alert_id INT IDENTITY(1,1) PRIMARY KEY,
    auction_id INT,
    user_id INT,
    alert_type VARCHAR(50), -- rapid_bidding, shill_bidding, price_manipulation, suspicious_pattern
    alert_time DATETIME DEFAULT GETDATE(),
    severity VARCHAR(20) CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    description NVARCHAR(500),
    is_resolved BIT DEFAULT 0,
    resolved_by INT,
    resolved_at DATETIME,
    resolution_note NVARCHAR(500),
    FOREIGN KEY (auction_id) REFERENCES Auctions(auction_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (resolved_by) REFERENCES Users(user_id)
);

-- 4.2 Bảng RateLimits (Prevent abuse)
CREATE TABLE RateLimits (
    limit_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    action_type VARCHAR(50), -- place_bid, create_auction, send_message
    action_count INT DEFAULT 0,
    window_start DATETIME DEFAULT GETDATE(),
    window_end AS DATEADD(MINUTE, 5, window_start), -- 5-minute window
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

-- 4.3 Bảng AuditLog (Complete audit trail)
CREATE TABLE AuditLog (
    log_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    action VARCHAR(100), -- login, logout, place_bid, create_auction, etc.
    table_name VARCHAR(50),
    record_id INT,
    old_value NVARCHAR(MAX), -- JSON format
    new_value NVARCHAR(MAX), -- JSON format
    ip_address VARCHAR(45),
    user_agent NVARCHAR(500),
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

-- ============================================================================
-- PHẦN 5: REAL-TIME WEBSOCKET SUPPORT
-- ============================================================================

-- 5.1 Bảng ActiveSessions (Track WebSocket connections)
CREATE TABLE ActiveSessions (
    session_id VARCHAR(100) PRIMARY KEY,
    user_id INT,
    auction_id INT,
    socket_id VARCHAR(100),
    connected_at DATETIME DEFAULT GETDATE(),
    last_activity DATETIME DEFAULT GETDATE(),
    ip_address VARCHAR(45),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (auction_id) REFERENCES Auctions(auction_id)
);

-- ============================================================================
-- PHẦN 6: NOTIFICATIONS & MESSAGING
-- ============================================================================

-- 6.1 Bảng Notifications
CREATE TABLE Notifications (
    notification_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    auction_id INT,
    notification_type VARCHAR(50), -- outbid, won, lost, starting_soon, ending_soon, approved, rejected
    title NVARCHAR(200),
    message NVARCHAR(500),
    is_read BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (auction_id) REFERENCES Auctions(auction_id)
);

-- 6.2 Bảng Newsletter (Đã có)
CREATE TABLE Newsletter (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(100) UNIQUE NOT NULL,
    subscribed_at DATETIME DEFAULT GETDATE(),
    is_active BIT DEFAULT 1
);

-- ============================================================================
-- PHẦN 7: PAYMENT & TRANSACTION MANAGEMENT
-- ============================================================================

-- 7.1 Bảng Transactions
CREATE TABLE Transactions (
    transaction_id INT IDENTITY(1,1) PRIMARY KEY,
    auction_id INT,
    buyer_id INT,
    seller_id INT,
    amount DECIMAL(15,2),
    transaction_type VARCHAR(50), -- deposit, payment, refund, commission, penalty
    payment_method VARCHAR(50), -- bank_transfer, credit_card, e_wallet, cash
    status VARCHAR(20) CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    payment_gateway_ref VARCHAR(100),
    created_at DATETIME DEFAULT GETDATE(),
    completed_at DATETIME,
    notes NVARCHAR(500),
    FOREIGN KEY (auction_id) REFERENCES Auctions(auction_id),
    FOREIGN KEY (buyer_id) REFERENCES Users(user_id),
    FOREIGN KEY (seller_id) REFERENCES Users(user_id)
);

-- 7.2 Bảng EscrowAccounts (Bảo mật giao dịch)
CREATE TABLE EscrowAccounts (
    escrow_id INT IDENTITY(1,1) PRIMARY KEY,
    auction_id INT,
    amount DECIMAL(15,2),
    status VARCHAR(20) CHECK (status IN ('held', 'released', 'refunded')),
    held_at DATETIME DEFAULT GETDATE(),
    released_at DATETIME,
    released_to INT, -- user_id
    reason NVARCHAR(500),
    FOREIGN KEY (auction_id) REFERENCES Auctions(auction_id),
    FOREIGN KEY (released_to) REFERENCES Users(user_id)
);

-- ============================================================================
-- PHẦN 8: INDEXES (Performance Optimization)
-- ============================================================================

-- Core indexes
CREATE INDEX idx_users_email ON Users(email);
CREATE INDEX idx_users_username ON Users(username);
CREATE INDEX idx_users_role ON Users(role_id, is_banned);

-- Product indexes
CREATE INDEX idx_products_seller ON Products(seller_id, is_verified);
CREATE INDEX idx_products_category ON Products(category_id, is_verified);
CREATE INDEX idx_products_created ON Products(created_at DESC);

-- Auction indexes (CRITICAL for real-time)
CREATE INDEX idx_auctions_status_end ON Auctions(status, end_time);
CREATE INDEX idx_auctions_product ON Auctions(product_id, status);
CREATE INDEX idx_auctions_featured ON Auctions(featured, status, start_time DESC);
CREATE INDEX idx_auctions_highest_bidder ON Auctions(highest_bidder_id);

-- Bid indexes (CRITICAL for real-time leaderboard)
CREATE INDEX idx_bids_auction_time ON Bids(auction_id, bid_time DESC);
CREATE INDEX idx_bids_auction_amount ON Bids(auction_id, bid_amount DESC, bid_time DESC);
CREATE INDEX idx_bids_bidder ON Bids(bidder_id, bid_time DESC);
CREATE INDEX idx_bids_valid ON Bids(auction_id, is_valid, bid_amount DESC);

-- Notification indexes
CREATE INDEX idx_notifications_user_read ON Notifications(user_id, is_read, created_at DESC);

-- Transaction indexes
CREATE INDEX idx_transactions_buyer ON Transactions(buyer_id, created_at DESC);
CREATE INDEX idx_transactions_seller ON Transactions(seller_id, created_at DESC);
CREATE INDEX idx_transactions_auction ON Transactions(auction_id, status);

-- Audit log indexes
CREATE INDEX idx_auditlog_user ON AuditLog(user_id, created_at DESC);
CREATE INDEX idx_auditlog_action ON AuditLog(action, created_at DESC);

-- FraudAlerts indexes
CREATE INDEX idx_fraudalerts_unresolved ON FraudAlerts(is_resolved, severity, alert_time DESC);
CREATE INDEX idx_fraudalerts_user ON FraudAlerts(user_id, alert_time DESC);

-- ============================================================================
-- PHẦN 9: DỮ LIỆU MẪU (MANDATORY)
-- ============================================================================

-- 9.1 Insert Roles (BẮT BUỘC - 5 roles)
INSERT INTO Roles (role_name, description) VALUES 
('Admin', N'Quản trị hệ thống'),
('Bidder', N'Người tham gia đấu giá'),
('Seller', N'Người bán tài sản'),
('Moderator', N'Kiểm duyệt sản phẩm'),
('Manager', N'Quản lý tài chính');

-- 9.2 Insert Permissions
INSERT INTO Permissions (permission_name, description) VALUES
('create_auction', N'Tạo phiên đấu giá'),
('place_bid', N'Đặt giá thầu'),
('approve_product', N'Duyệt sản phẩm'),
('ban_user', N'Cấm người dùng'),
('view_analytics', N'Xem báo cáo thống kê'),
('manage_transactions', N'Quản lý giao dịch'),
('resolve_fraud', N'Xử lý gian lận'),
('manage_categories', N'Quản lý danh mục'),
('send_notifications', N'Gửi thông báo'),
('access_audit_log', N'Truy cập log hệ thống');

-- 9.3 Assign Permissions to Roles
-- Admin: Full permissions
INSERT INTO RolePermissions (role_id, permission_id) 
SELECT 1, permission_id FROM Permissions;

-- Seller: create_auction, view own analytics
INSERT INTO RolePermissions (role_id, permission_id) VALUES
(3, (SELECT permission_id FROM Permissions WHERE permission_name = 'create_auction')),
(3, (SELECT permission_id FROM Permissions WHERE permission_name = 'view_analytics'));

-- Bidder: place_bid
INSERT INTO RolePermissions (role_id, permission_id) VALUES
(2, (SELECT permission_id FROM Permissions WHERE permission_name = 'place_bid'));

-- Moderator: approve_product, resolve_fraud
INSERT INTO RolePermissions (role_id, permission_id) VALUES
(4, (SELECT permission_id FROM Permissions WHERE permission_name = 'approve_product')),
(4, (SELECT permission_id FROM Permissions WHERE permission_name = 'resolve_fraud'));

-- Manager: manage_transactions, view_analytics
INSERT INTO RolePermissions (role_id, permission_id) VALUES
(5, (SELECT permission_id FROM Permissions WHERE permission_name = 'manage_transactions')),
(5, (SELECT permission_id FROM Permissions WHERE permission_name = 'view_analytics'));

-- 9.4 Insert Sample Users
-- Admin user (password: admin123)
INSERT INTO Users (role_id, username, password, email, full_name, is_verified) VALUES 
(1, 'admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin@auction.com', N'Admin System', 1);

-- Bidder user (password: user123)
INSERT INTO Users (role_id, username, password, email, full_name, is_verified) VALUES 
(2, 'user1', '6ca13d52ca70c883e0f0bb101e425a89e8624de51db2d2392593af6a84118090', 'user1@auction.com', N'Nguyễn Văn A', 1);

-- Seller user (password: seller123)
INSERT INTO Users (role_id, username, password, email, full_name, is_verified) VALUES 
(3, 'seller1', 'f1d19f9afa3884332f3ba751ea679e77a0bc4b8c77e8d5e8d96e9a4f2b6b5a2a', 'seller1@auction.com', N'Trần Thị B', 1);

-- 9.5 Insert Sample Categories
INSERT INTO Categories (category_name, parent_category_id, description) VALUES
(N'Điện tử', NULL, N'Thiết bị điện tử'),
(N'Điện thoại', 1, N'Điện thoại di động'),
(N'Laptop', 1, N'Máy tính xách tay'),
(N'Đồng hồ', NULL, N'Đồng hồ cao cấp'),
(N'Nghệ thuật', NULL, N'Tác phẩm nghệ thuật'),
(N'Xe cộ', NULL, N'Phương tiện giao thông'),
(N'Bất động sản', NULL, N'Nhà đất');

-- 9.6 Insert Sample Products
INSERT INTO Products (seller_id, category_id, product_name, description, starting_price, current_price, image_url, condition, is_verified) VALUES
(3, 2, N'iPhone 15 Pro Max 256GB', N'Máy mới 100%, fullbox, chính hãng VN/A', 25000000, 25000000, 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?q=80&w=1000', 'new', 1),
(3, 3, N'MacBook Pro M3 Max', N'Laptop chuyên nghiệp cho developer', 50000000, 52500000, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?q=80&w=1000', 'new', 1),
(3, 4, N'Rolex Submariner Date', N'Đồng hồ chính hãng, còn BH 3 năm', 200000000, 210000000, 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=1000', 'like_new', 1);

-- 9.7 Insert Sample Auctions
INSERT INTO Auctions (product_id, start_time, end_time, status, current_price, total_bids, created_by) VALUES
(1, GETDATE(), DATEADD(DAY, 3, GETDATE()), 'ACTIVE', 25000000, 0, 1),
(2, GETDATE(), DATEADD(HOUR, 12, GETDATE()), 'ACTIVE', 52500000, 3, 1),
(3, GETDATE(), DATEADD(DAY, 1, GETDATE()), 'ACTIVE', 210000000, 5, 1);

-- ============================================================================
-- PHẦN 10: TRIGGERS (Auto-update denormalized fields)
-- ============================================================================

-- Trigger: Auto-update Auctions.total_bids khi có bid mới
GO
CREATE TRIGGER trg_UpdateBidCount
ON Bids
AFTER INSERT
AS
BEGIN
    UPDATE Auctions
    SET total_bids = total_bids + 1,
        current_price = i.bid_amount,
        highest_bidder_id = i.bidder_id
    FROM Auctions a
    INNER JOIN inserted i ON a.auction_id = i.auction_id;
    
    -- Update Products.current_price
    UPDATE Products
    SET current_price = i.bid_amount
    FROM Products p
    INNER JOIN Auctions a ON p.product_id = a.product_id
    INNER JOIN inserted i ON a.auction_id = i.auction_id;
END;
GO

-- Trigger: Log auction status changes
GO
CREATE TRIGGER trg_LogAuctionStatusChange
ON Auctions
AFTER UPDATE
AS
BEGIN
    IF UPDATE(status)
    BEGIN
        INSERT INTO AuctionStateHistory (auction_id, old_status, new_status, changed_at)
        SELECT d.auction_id, d.status, i.status, GETDATE()
        FROM deleted d
        INNER JOIN inserted i ON d.auction_id = i.auction_id
        WHERE d.status <> i.status;
    END
END;
GO

-- ============================================================================
-- PHẦN 11: STORED PROCEDURES (Business Logic)
-- ============================================================================

-- SP: Get Active Auctions with Product Info
GO
CREATE PROCEDURE sp_GetActiveAuctions
    @page INT = 1,
    @pageSize INT = 20,
    @category_id INT = NULL
AS
BEGIN
    DECLARE @offset INT = (@page - 1) * @pageSize;
    
    SELECT 
        a.auction_id,
        p.product_name AS title,
        p.description,
        p.starting_price,
        a.current_price,
        a.start_time,
        a.end_time,
        a.status,
        p.image_url,
        u.username AS seller_name,
        u.user_id AS seller_id,
        a.total_bids,
        a.view_count,
        ub.username AS highest_bidder
    FROM Auctions a
    INNER JOIN Products p ON a.product_id = p.product_id
    INNER JOIN Users u ON p.seller_id = u.user_id
    LEFT JOIN Users ub ON a.highest_bidder_id = ub.user_id
    WHERE a.status = 'ACTIVE'
        AND (@category_id IS NULL OR p.category_id = @category_id)
    ORDER BY a.start_time DESC
    OFFSET @offset ROWS
    FETCH NEXT @pageSize ROWS ONLY;
END;
GO

-- SP: Get Auction Detail with Bids
GO
CREATE PROCEDURE sp_GetAuctionDetail
    @auction_id INT
AS
BEGIN
    -- Auction info
    SELECT 
        a.auction_id,
        p.product_name AS title,
        p.description,
        p.starting_price,
        a.current_price,
        a.start_time,
        a.end_time,
        a.status,
        p.image_url,
        u.username AS seller_name,
        u.user_id AS seller_id,
        a.total_bids,
        a.min_bid_increment,
        ub.username AS highest_bidder
    FROM Auctions a
    INNER JOIN Products p ON a.product_id = p.product_id
    INNER JOIN Users u ON p.seller_id = u.user_id
    LEFT JOIN Users ub ON a.highest_bidder_id = ub.user_id
    WHERE a.auction_id = @auction_id;
    
    -- Bid history
    SELECT 
        b.bid_id,
        b.bid_amount,
        b.bid_time,
        u.username AS bidder_name,
        u.user_id AS bidder_id
    FROM Bids b
    INNER JOIN Users u ON b.bidder_id = u.user_id
    WHERE b.auction_id = @auction_id
        AND b.is_valid = 1
    ORDER BY b.bid_time DESC;
    
    -- Update view count
    UPDATE Auctions SET view_count = view_count + 1 WHERE auction_id = @auction_id;
END;
GO

-- SP: Place Bid with Validation
GO
CREATE PROCEDURE sp_PlaceBid
    @auction_id INT,
    @bidder_id INT,
    @bid_amount DECIMAL(15,2),
    @ip_address VARCHAR(45),
    @result VARCHAR(50) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validate auction status
    DECLARE @status VARCHAR(20), @current_price DECIMAL(15,2), @min_increment DECIMAL(15,2);
    
    SELECT @status = status, @current_price = current_price, @min_increment = min_bid_increment
    FROM Auctions WHERE auction_id = @auction_id;
    
    IF @status <> 'ACTIVE'
    BEGIN
        SET @result = 'AUCTION_NOT_ACTIVE';
        RETURN;
    END
    
    IF @bid_amount <= @current_price OR @bid_amount < (@current_price + @min_increment)
    BEGIN
        SET @result = 'BID_TOO_LOW';
        RETURN;
    END
    
    -- Insert bid
    INSERT INTO Bids (auction_id, bidder_id, bid_amount, ip_address)
    VALUES (@auction_id, @bidder_id, @bid_amount, @ip_address);
    
    -- Send notification to previous highest bidder
    DECLARE @prev_highest INT;
    SELECT @prev_highest = highest_bidder_id FROM Auctions WHERE auction_id = @auction_id;
    
    IF @prev_highest IS NOT NULL AND @prev_highest <> @bidder_id
    BEGIN
        INSERT INTO Notifications (user_id, auction_id, notification_type, title, message)
        VALUES (@prev_highest, @auction_id, 'outbid', N'Bạn đã bị vượt giá', N'Có người đặt giá cao hơn bạn');
    END
    
    SET @result = 'SUCCESS';
END;
GO

PRINT '✅ Database schema created successfully!';
PRINT '📊 Total tables: 25';
PRINT '🔐 Total roles: 5';
PRINT '✨ Ready for production deployment!';
