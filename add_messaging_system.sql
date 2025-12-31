-- ============================================================================
-- THÊM HỆ THỐNG MESSAGING VÀ CẬP NHẬT AUCTIONS
-- Chat giữa buyer-seller, đánh dấu giao dịch hoàn thành
-- ============================================================================

USE auction_system;
GO

-- 1. Tạo bảng Messages (nếu chưa có)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Messages')
BEGIN
    CREATE TABLE Messages (
        message_id INT IDENTITY(1,1) PRIMARY KEY,
        sender_id INT NOT NULL,
        receiver_id INT NOT NULL,
        auction_id INT NULL, -- Tin nhắn liên quan đến phiên đấu giá nào
        message_content NVARCHAR(MAX) NOT NULL,
        is_read BIT DEFAULT 0,
        sent_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (sender_id) REFERENCES Users(user_id) ON DELETE NO ACTION,
        FOREIGN KEY (receiver_id) REFERENCES Users(user_id) ON DELETE NO ACTION,
        FOREIGN KEY (auction_id) REFERENCES Auctions(auction_id) ON DELETE CASCADE
    );
    
    PRINT 'Đã tạo bảng Messages';
    
    -- Tạo indexes để tăng tốc query
    CREATE INDEX IX_Messages_SenderId ON Messages(sender_id);
    CREATE INDEX IX_Messages_ReceiverId ON Messages(receiver_id);
    CREATE INDEX IX_Messages_AuctionId ON Messages(auction_id);
    CREATE INDEX IX_Messages_SentAt ON Messages(sent_at DESC);
    
    PRINT 'Đã tạo indexes cho bảng Messages';
END
ELSE
BEGIN
    PRINT 'Bảng Messages đã tồn tại';
END
GO

-- 2. Thêm cột transaction_completed vào Auctions (đánh dấu đã hoàn thành giao dịch)
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Auctions' AND COLUMN_NAME = 'transaction_completed'
)
BEGIN
    ALTER TABLE Auctions ADD transaction_completed BIT DEFAULT 0;
    PRINT 'Đã thêm cột transaction_completed vào bảng Auctions';
END
ELSE
BEGIN
    PRINT 'Cột transaction_completed đã tồn tại trong bảng Auctions';
END
GO

-- 3. Thêm cột completed_at để lưu thời gian hoàn thành giao dịch
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Auctions' AND COLUMN_NAME = 'completed_at'
)
BEGIN
    ALTER TABLE Auctions ADD completed_at DATETIME NULL;
    PRINT 'Đã thêm cột completed_at vào bảng Auctions';
END
ELSE
BEGIN
    PRINT 'Cột completed_at đã tồn tại trong bảng Auctions';
END
GO

-- 4. Kiểm tra kết quả
SELECT 'Messages table' AS [Object],
       CASE WHEN OBJECT_ID('Messages', 'U') IS NOT NULL 
            THEN 'Tồn tại' 
            ELSE 'Không tồn tại' 
       END AS [Status]
UNION ALL
SELECT 'Auctions.transaction_completed' AS [Object],
       CASE WHEN COL_LENGTH('Auctions', 'transaction_completed') IS NOT NULL 
            THEN 'Tồn tại' 
            ELSE 'Không tồn tại' 
       END AS [Status]
UNION ALL
SELECT 'Auctions.completed_at' AS [Object],
       CASE WHEN COL_LENGTH('Auctions', 'completed_at') IS NOT NULL 
            THEN 'Tồn tại' 
            ELSE 'Không tồn tại' 
       END AS [Status];
GO

PRINT 'Script hoàn tất!';
