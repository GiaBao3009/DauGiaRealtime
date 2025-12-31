-- ============================================================================
-- THÊM BẢNG WATCHLIST VÀ CỘT AVATAR_URL
-- Chạy script này để cập nhật database hiện tại
-- ============================================================================

USE auction_system;
GO

-- 1. Thêm cột avatar_url vào bảng Users (nếu chưa có)
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'avatar_url'
)
BEGIN
    ALTER TABLE Users ADD avatar_url NVARCHAR(500) NULL;
    PRINT 'Đã thêm cột avatar_url vào bảng Users';
END
ELSE
BEGIN
    PRINT 'Cột avatar_url đã tồn tại trong bảng Users';
END
GO

-- 2. Tạo bảng Watchlist (nếu chưa có)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Watchlist')
BEGIN
    CREATE TABLE Watchlist (
        watchlist_id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        auction_id INT NOT NULL,
        added_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (auction_id) REFERENCES Auctions(auction_id) ON DELETE CASCADE,
        CONSTRAINT UQ_Watchlist_UserAuction UNIQUE (user_id, auction_id)
    );
    
    PRINT 'Đã tạo bảng Watchlist';
    
    -- Tạo index để tăng tốc query
    CREATE INDEX IX_Watchlist_UserId ON Watchlist(user_id);
    CREATE INDEX IX_Watchlist_AuctionId ON Watchlist(auction_id);
    
    PRINT 'Đã tạo indexes cho bảng Watchlist';
END
ELSE
BEGIN
    PRINT 'Bảng Watchlist đã tồn tại';
END
GO

-- 3. Kiểm tra kết quả
SELECT 'Users.avatar_url' AS [Column], 
       CASE WHEN COL_LENGTH('Users', 'avatar_url') IS NOT NULL 
            THEN 'Tồn tại' 
            ELSE 'Không tồn tại' 
       END AS [Status]
UNION ALL
SELECT 'Watchlist table' AS [Column],
       CASE WHEN OBJECT_ID('Watchlist', 'U') IS NOT NULL 
            THEN 'Tồn tại' 
            ELSE 'Không tồn tại' 
       END AS [Status];
GO

PRINT 'Script hoàn tất!';
