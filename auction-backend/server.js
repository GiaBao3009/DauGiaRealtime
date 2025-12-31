// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
//CORS (Cross-Origin Resource Sharing)
const cors = require('cors');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- QUAN TRỌNG: Import thư viện hỗ trợ Windows Auth ---
const sql = require('mssql/msnodesqlv8'); 

const app = express();
app.use(cors());
app.use(express.json({ charset: 'utf-8' }));
app.use(express.urlencoded({ extended: true, charset: 'utf-8' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// UTF-8 response middleware
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
});

// Multer config for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'auction-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif, webp)'));
        }
    }
});

// --- CẤU HÌNH KẾT NỐI (Đã điền BAOLDZ) ---
const dbConfig = {
    server: 'BAOLDZ',       // Tên server của bạn
    database: 'auction_system',
    driver: 'msnodesqlv8',  // Bắt buộc dòng này
    options: {
        trustedConnection: true, // Bật chế độ không cần mật khẩu
        useUTC: false
    }
};

// Hàm tiện ích SHA-256
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Auto-complete auctions function
async function autoCompleteAuctions(pool) {
    try {
        const result = await pool.request().query(`
            UPDATE Auctions
            SET status = 'COMPLETED'
            WHERE status = 'ACTIVE' 
            AND end_time < GETDATE()
        `);
        
        if (result.rowsAffected[0] > 0) {
            console.log(`✅ Auto-completed ${result.rowsAffected[0]} auction(s)`);
            
            // Notify winners
            const winners = await pool.request().query(`
                SELECT 
                    a.auction_id,
                    a.highest_bidder_id,
                    p.product_name
                FROM Auctions a
                INNER JOIN Products p ON a.product_id = p.product_id
                WHERE a.status = 'COMPLETED' 
                AND a.highest_bidder_id IS NOT NULL
                AND NOT EXISTS (
                    SELECT 1 FROM Notifications n 
                    WHERE n.auction_id = a.auction_id 
                    AND n.user_id = a.highest_bidder_id 
                    AND n.notification_type = 'won'
                )
            `);

            for (const winner of winners.recordset) {
                await pool.request()
                    .input('userId', sql.Int, winner.highest_bidder_id)
                    .input('title', sql.NVarChar, 'Chúc mừng! Bạn đã thắng đấu giá')
                    .input('message', sql.NVarChar, `Bạn đã thắng phiên đấu giá "${winner.product_name}"`)
                    .input('type', sql.VarChar, 'won')
                    .input('auctionId', sql.Int, winner.auction_id)
                    .query(`
                        INSERT INTO Notifications (user_id, title, message, notification_type, auction_id)
                        VALUES (@userId, @title, @message, @type, @auctionId)
                    `);
            }
        }
    } catch (err) {
        console.error('Error auto-completing auctions:', err);
    }
}

// In-memory storage for reset codes (trong production nên dùng Redis hoặc database)
const resetCodes = new Map();

// Kết nối Database
sql.connect(dbConfig).then(pool => {
    if (pool.connected) console.log("✅ Đã kết nối SQL Server (BAOLDZ) thành công!");
    
    // --- API ROUTES ---

    // 1. Đăng ký
    app.post('/register', async (req, res) => {
        try {
            const { username, password, email, role_id } = req.body;
            const hashedPassword = hashPassword(password);
            // Parameterized Queries (Chống SQL Injection):
            await pool.request()
                .input('user', sql.VarChar, username)
                .input('pass', sql.Char(64), hashedPassword)
                .input('email', sql.VarChar, email)
                .input('role', sql.Int, role_id)
                .query("INSERT INTO Users (username, password, email, role_id) VALUES (@user, @pass, @email, @role)");

            res.json({ message: "Đăng ký thành công!" });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    });

    // 1.5. Upload image
    app.post('/upload', upload.single('image'), (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'Không có file được tải lên' });
            }
            const imageUrl = `http://localhost:3001/uploads/${req.file.filename}`;
            res.json({ 
                message: 'Upload thành công',
                imageUrl: imageUrl,
                filename: req.file.filename
            });
        } catch (err) {
            console.error('Upload error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // 2. Đăng nhập
    app.post('/login', async (req, res) => {
        try {
            const { username, password } = req.body;
            console.log('🔐 Login attempt:', { username, passwordLength: password?.length });
            
            const hashedPassword = hashPassword(password);
            console.log('🔑 Hashed password:', hashedPassword.substring(0, 20) + '...');

            const result = await pool.request()
                .input('user', sql.VarChar, username)
                .input('pass', sql.Char(64), hashedPassword)
                .query("SELECT * FROM Users WHERE username = @user AND password = @pass");

            if (result.recordset.length > 0) {
                console.log('✅ Login successful for:', username);
                res.json({ message: "Login thành công", user: result.recordset[0] });
            } else {
                console.log('❌ Login failed - checking if user exists');
                const checkUser = await pool.request()
                    .input('user', sql.VarChar, username)
                    .query("SELECT username, LEFT(password, 20) as pwd_preview FROM Users WHERE username = @user");
                console.log('User in DB:', checkUser.recordset[0]);
                res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" });
            }
        } catch (err) {
            console.error('💥 Login error:', err.message);
            res.status(500).json({ error: err.message });
        }
    });

    // Get Admin user info (PHẢI ĐẶT TRƯỚC /user/:userId)
    app.get('/users/admin', async (req, res) => {
        try {
            const result = await pool.request()
                .query(`
                    SELECT TOP 1
                        user_id, 
                        username, 
                        email, 
                        full_name, 
                        phone_number, 
                        avatar_url,
                        role_id
                    FROM Users 
                    WHERE role_id = 1
                    ORDER BY user_id ASC
                `);

            if (result.recordset.length > 0) {
                res.json({ success: true, user: result.recordset[0] });
            } else {
                res.status(404).json({ success: false, message: 'Không tìm thấy Admin' });
            }
        } catch (err) {
            console.error('Error fetching admin:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // 2.4. Get user info by ID
    app.get('/user/:userId', async (req, res) => {
        try {
            const { userId } = req.params;
            const result = await pool.request()
                .input('userId', sql.Int, userId)
                .query(`
                    SELECT 
                        user_id, 
                        username, 
                        email, 
                        full_name, 
                        phone_number, 
                        avatar_url,
                        role_id,
                        trust_score,
                        is_verified,
                        created_at
                    FROM Users 
                    WHERE user_id = @userId
                `);

            if (result.recordset.length > 0) {
                res.json({ success: true, user: result.recordset[0] });
            } else {
                res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
            }
        } catch (err) {
            console.error('Error fetching user:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // 2.5. Forgot Password - Send reset code
    app.post('/forgot-password', async (req, res) => {
        try {
            const { email } = req.body;

            const result = await pool.request()
                .input('email', sql.VarChar, email)
                .query("SELECT user_id, username FROM Users WHERE email = @email");

            if (result.recordset.length === 0) {
                return res.status(404).json({ error: 'Email không tồn tại trong hệ thống' });
            }

            // Generate 6-digit code
            const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
            
            // Store code with expiration (10 minutes)
            resetCodes.set(email, {
                code: resetCode,
                expiresAt: Date.now() + 10 * 60 * 1000,
                userId: result.recordset[0].user_id
            });

            // Trong production: Gửi email với resetCode
            console.log(`🔐 Reset code for ${email}: ${resetCode}`);

            res.json({ 
                message: 'Mã xác thực đã được gửi đến email của bạn',
                // ONLY FOR DEVELOPMENT - remove in production
                resetCode: resetCode
            });
        } catch (err) {
            console.error('Forgot password error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // 2.6. Verify reset code
    app.post('/verify-reset-code', async (req, res) => {
        try {
            const { email, code } = req.body;

            const storedData = resetCodes.get(email);

            if (!storedData) {
                return res.status(400).json({ error: 'Mã xác thực không tồn tại hoặc đã hết hạn' });
            }

            if (Date.now() > storedData.expiresAt) {
                resetCodes.delete(email);
                return res.status(400).json({ error: 'Mã xác thực đã hết hạn' });
            }

            if (storedData.code !== code) {
                return res.status(400).json({ error: 'Mã xác thực không đúng' });
            }

            res.json({ message: 'Mã xác thực hợp lệ' });
        } catch (err) {
            console.error('Verify code error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // 2.7. Reset password
    app.post('/reset-password', async (req, res) => {
        try {
            const { email, code, newPassword } = req.body;

            const storedData = resetCodes.get(email);

            if (!storedData || storedData.code !== code) {
                return res.status(400).json({ error: 'Mã xác thực không hợp lệ' });
            }

            if (Date.now() > storedData.expiresAt) {
                resetCodes.delete(email);
                return res.status(400).json({ error: 'Mã xác thực đã hết hạn' });
            }

            const hashedPassword = hashPassword(newPassword);

            await pool.request()
                .input('userId', sql.Int, storedData.userId)
                .input('password', sql.Char(64), hashedPassword)
                .query("UPDATE Users SET password = @password WHERE user_id = @userId");

            // Remove used code
            resetCodes.delete(email);

            res.json({ message: 'Đặt lại mật khẩu thành công' });
        } catch (err) {
            console.error('Reset password error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // 3. Lấy danh sách phiên đấu giá (có phân trang)
    app.get('/auctions', async (req, res) => {
        try {
            const { status, category, page = 1, limit = 10 } = req.query;
            const offset = (page - 1) * limit;

            let query = `
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
                    p.category_id,
                    c.category_name,
                    COALESCE(u.full_name, u.username) AS seller_name,
                    u.user_id AS seller_id,
                    a.total_bids,
                    a.view_count,
                    COALESCE(ub.full_name, ub.username) AS highest_bidder
                FROM Auctions a
                INNER JOIN Products p ON a.product_id = p.product_id
                INNER JOIN Users u ON p.seller_id = u.user_id
                LEFT JOIN Categories c ON p.category_id = c.category_id
                LEFT JOIN Users ub ON a.highest_bidder_id = ub.user_id
            `;

            const conditions = [];
            if (status) {
                conditions.push('a.status = @status');
            }
            if (category && category !== 'all') {
                conditions.push('c.category_name = @category');
            }

            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }

            query += ` ORDER BY a.start_time DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;

            const request = pool.request()
                .input('offset', sql.Int, offset)
                .input('limit', sql.Int, parseInt(limit));

            if (status) {
                request.input('status', sql.VarChar, status);
            }
            if (category && category !== 'all') {
                request.input('category', sql.NVarChar, category);
            }

            const result = await request.query(query);
            res.json({ auctions: result.recordset });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 3.5. Lấy danh sách categories
    app.get('/categories', async (req, res) => {
        try {
            const result = await pool.request()
                .query('SELECT category_id, category_name, description FROM Categories ORDER BY category_name');
            res.json({ categories: result.recordset });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 3.6. Get public stats for home page
    app.get('/stats', async (req, res) => {
        try {
            const result = await pool.request().query(`
                SELECT 
                    (SELECT COUNT(*) FROM Users) as onlineUsers,
                    (SELECT COUNT(*) FROM Auctions WHERE status IN ('COMPLETED', 'ACTIVE')) as soldProducts,
                    (SELECT ISNULL(SUM(current_price), 0) FROM Auctions WHERE status IN ('COMPLETED', 'ACTIVE')) as totalTransactions,
                    (SELECT COUNT(*) FROM Auctions WHERE status = 'ACTIVE' AND start_time <= GETDATE()) as activeAuctions
            `);
            
            res.json({ success: true, stats: result.recordset[0] });
        } catch (err) {
            console.error('Error fetching public stats:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // 4. Lấy chi tiết phiên đấu giá theo ID
    app.get('/auctions/:id', async (req, res) => {
        try {
            const auctionId = req.params.id;

            const auctionResult = await pool.request()
                .input('id', sql.Int, auctionId)
                .query(`
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
                        COALESCE(u.full_name, u.username) AS seller_name,
                        u.user_id AS seller_id,
                        a.total_bids,
                        a.view_count,
                        a.min_bid_increment,
                        COALESCE(ub.full_name, ub.username) AS highest_bidder
                    FROM Auctions a
                    INNER JOIN Products p ON a.product_id = p.product_id
                    INNER JOIN Users u ON p.seller_id = u.user_id
                    LEFT JOIN Users ub ON a.highest_bidder_id = ub.user_id
                    WHERE a.auction_id = @id
                `);

            if (auctionResult.recordset.length === 0) {
                return res.status(404).json({ message: "Không tìm thấy phiên đấu giá" });
            }

            // Update view count FIRST
            await pool.request()
                .input('id', sql.Int, auctionId)
                .query('UPDATE Auctions SET view_count = view_count + 1 WHERE auction_id = @id');

            // Then fetch updated data
            const updatedAuctionResult = await pool.request()
                .input('id', sql.Int, auctionId)
                .query(`
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
                        COALESCE(u.full_name, u.username) AS seller_name,
                        u.user_id AS seller_id,
                        a.total_bids,
                        a.view_count,
                        a.min_bid_increment,
                        COALESCE(ub.full_name, ub.username) AS highest_bidder
                    FROM Auctions a
                    INNER JOIN Products p ON a.product_id = p.product_id
                    INNER JOIN Users u ON p.seller_id = u.user_id
                    LEFT JOIN Users ub ON a.highest_bidder_id = ub.user_id
                    WHERE a.auction_id = @id
                `);

            const bidsResult = await pool.request()
                .input('id', sql.Int, auctionId)
                .query(`
                    SELECT 
                        b.bid_id,
                        b.bid_amount,
                        b.bid_time,
                        COALESCE(u.full_name, u.username) AS bidder_name,
                        u.user_id AS bidder_id
                    FROM Bids b
                    INNER JOIN Users u ON b.bidder_id = u.user_id
                    WHERE b.auction_id = @id AND b.is_valid = 1
                    ORDER BY b.bid_amount DESC, b.bid_time ASC
                `);

            // Chỉ giữ GIÁ CAO NHẤT của mỗi người
            const uniqueBids = [];
            const seenUsers = new Set();
            
            for (const bid of bidsResult.recordset) {
                if (!seenUsers.has(bid.bidder_id)) {
                    seenUsers.add(bid.bidder_id);
                    uniqueBids.push(bid);
                }
            }

            res.json({
                auction: updatedAuctionResult.recordset[0],
                bids: uniqueBids
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 4.5. Place a bid
    app.post('/bids', async (req, res) => {
        try {
            const { auction_id, bidder_id, bid_amount } = req.body;

            // Check if auction exists and is active
            const auctionCheck = await pool.request()
                .input('auctionId', sql.Int, auction_id)
                .query(`
                    SELECT a.auction_id, a.current_price, a.status, a.end_time, a.highest_bidder_id, p.seller_id
                    FROM Auctions a
                    INNER JOIN Products p ON a.product_id = p.product_id
                    WHERE a.auction_id = @auctionId
                `);

            if (auctionCheck.recordset.length === 0) {
                return res.status(404).json({ message: 'Phiên đấu giá không tồn tại' });
            }

            const auction = auctionCheck.recordset[0];

            // KHÔNG CHO TỰ ĐẤU GIÁ VỚI CHÍNH MÌNH
            if (auction.highest_bidder_id === bidder_id) {
                return res.status(400).json({ 
                    message: 'Bạn đang là người đặt giá cao nhất! Không thể tự vượt giá chính mình.' 
                });
            }

            // Check if auction is active
            if (auction.status !== 'ACTIVE') {
                return res.status(400).json({ message: 'Phiên đấu giá không còn hoạt động' });
            }

            // Check if auction has ended
            if (new Date(auction.end_time) < new Date()) {
                return res.status(400).json({ message: 'Phiên đấu giá đã kết thúc' });
            }

            // Check if bid amount is higher than current price
            if (bid_amount <= auction.current_price) {
                return res.status(400).json({ 
                    message: `Giá đặt phải cao hơn giá hiện tại (${auction.current_price.toLocaleString('vi-VN')} ₫)` 
                });
            }

            // Insert bid
            await pool.request()
                .input('auctionId', sql.Int, auction_id)
                .input('bidderId', sql.Int, bidder_id)
                .input('bidAmount', sql.Decimal(15, 2), bid_amount)
                .query(`
                    INSERT INTO Bids (auction_id, bidder_id, bid_amount, bid_time, is_valid)
                    VALUES (@auctionId, @bidderId, @bidAmount, GETDATE(), 1)
                `);

            // Update auction current_price, highest_bidder, total_bids
            await pool.request()
                .input('auctionId', sql.Int, auction_id)
                .input('bidderId', sql.Int, bidder_id)
                .input('bidAmount', sql.Decimal(15, 2), bid_amount)
                .query(`
                    UPDATE Auctions
                    SET current_price = @bidAmount,
                        highest_bidder_id = @bidderId,
                        total_bids = total_bids + 1
                    WHERE auction_id = @auctionId
                `);

            // Create notification for previous highest bidder
            const previousBidder = await pool.request()
                .input('auctionId', sql.Int, auction_id)
                .input('currentBidder', sql.Int, bidder_id)
                .query(`
                    SELECT DISTINCT bidder_id
                    FROM Bids
                    WHERE auction_id = @auctionId
                    AND bidder_id != @currentBidder
                `);

            for (const prevBidder of previousBidder.recordset) {
                await pool.request()
                    .input('userId', sql.Int, prevBidder.bidder_id)
                    .input('message', sql.NVarChar, `Bạn đã bị vượt giá! Ai đó vừa đặt ${bid_amount.toLocaleString('vi-VN')} ₫ cao hơn bạn.`)
                    .input('type', sql.VarChar, 'bid_outbid')
                    .input('auctionId', sql.Int, auction_id)
                    .query(`
                        INSERT INTO Notifications (user_id, message, type, related_auction_id, created_at)
                        VALUES (@userId, @message, @type, @auctionId, GETDATE())
                    `);
            }

            res.json({ 
                success: true,
                message: 'Đặt giá thành công'
            });

        } catch (err) {
            console.error('Error placing bid:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // 5. Tạo phiên đấu giá mới (Admin/Seller)
    app.post('/auctions', async (req, res) => {
        try {
            const { 
                title, 
                description, 
                starting_price, 
                start_time, 
                end_time, 
                seller_id,
                image_url,
                category_id 
            } = req.body;

            // Bước 1: Tạo Product
            const productResult = await pool.request()
                .input('seller', sql.Int, seller_id)
                .input('category', sql.Int, category_id || 1)
                .input('name', sql.NVarChar, title)
                .input('desc', sql.NVarChar, description)
                .input('start_price', sql.Decimal(15, 2), starting_price)
                .input('curr_price', sql.Decimal(15, 2), starting_price)
                .input('img', sql.NVarChar, image_url || null)
                .query(`
                    INSERT INTO Products (seller_id, category_id, product_name, description, starting_price, current_price, image_url, condition, is_verified)
                    OUTPUT INSERTED.product_id
                    VALUES (@seller, @category, @name, @desc, @start_price, @curr_price, @img, 'new', 1)
                `);

            const product_id = productResult.recordset[0].product_id;

            // Bước 2: Tạo Auction
            const auctionResult = await pool.request()
                .input('product_id', sql.Int, product_id)
                .input('start_time', sql.DateTime, start_time)
                .input('end_time', sql.DateTime, end_time)
                .input('start_price', sql.Decimal(15, 2), starting_price)
                .input('created_by', sql.Int, seller_id)
                .query(`
                    INSERT INTO Auctions (product_id, start_time, end_time, status, current_price, created_by)
                    OUTPUT INSERTED.auction_id
                    VALUES (@product_id, @start_time, @end_time, 'PENDING', @start_price, @created_by)
                `);

            res.json({ 
                message: "Tạo phiên đấu giá thành công!",
                auction_id: auctionResult.recordset[0].auction_id,
                product_id: product_id
            });
        } catch (err) {
            console.error('Error creating auction:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // 6. Update phiên đấu giá
    app.put('/auctions/:id', async (req, res) => {
        try {
            const auctionId = req.params.id;
            const { title, description, starting_price, start_time, end_time, image_url, status, user_id, role_id } = req.body;

            // Get auction info
            const auctionInfo = await pool.request()
                .input('id', sql.Int, auctionId)
                .query('SELECT product_id, start_time, total_bids FROM Auctions WHERE auction_id = @id');

            if (auctionInfo.recordset.length === 0) {
                return res.status(404).json({ message: 'Không tìm thấy phiên đấu giá' });
            }

            const product_id = auctionInfo.recordset[0].product_id;
            const totalBids = auctionInfo.recordset[0].total_bids || 0;

            // User chỉ sửa được khi CHƯA có lượt đấu giá nào
            if (totalBids > 0) {
                return res.status(403).json({ 
                    message: 'Phiên đấu giá đã có người đặt giá, không thể chỉnh sửa!' 
                });
            }

            // Update Product
            await pool.request()
                .input('id', sql.Int, product_id)
                .input('name', sql.NVarChar, title)
                .input('desc', sql.NVarChar, description)
                .input('price', sql.Decimal(15, 2), starting_price)
                .input('img', sql.NVarChar, image_url || null)
                .query(`
                    UPDATE Products 
                    SET product_name = @name, description = @desc, starting_price = @price, image_url = @img
                    WHERE product_id = @id
                `);

            // Update Auction
            await pool.request()
                .input('id', sql.Int, auctionId)
                .input('start', sql.DateTime, start_time)
                .input('end', sql.DateTime, end_time)
                .input('status', sql.VarChar, status || 'ACTIVE')
                .query(`
                    UPDATE Auctions 
                    SET start_time = @start, end_time = @end, status = @status
                    WHERE auction_id = @id
                `);

            res.json({ message: 'Cập nhật thành công!' });
        } catch (err) {
            console.error('Error updating auction:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // 7. Delete phiên đấu giá
    app.delete('/auctions/:id', async (req, res) => {
        try {
            const auctionId = req.params.id;

            // Get product_id and status
            const auctionInfo = await pool.request()
                .input('id', sql.Int, auctionId)
                .query('SELECT product_id, status FROM Auctions WHERE auction_id = @id');

            if (auctionInfo.recordset.length === 0) {
                return res.status(404).json({ message: 'Auction not found' });
            }

            const product_id = auctionInfo.recordset[0].product_id;
            const status = auctionInfo.recordset[0].status;

            // Cannot delete ACTIVE auctions
            if (status === 'ACTIVE') {
                return res.status(403).json({ message: 'Không thể xóa phiên đấu giá đã được duyệt!' });
            }

            // Delete Auction (CASCADE sẽ xóa Bids)
            await pool.request()
                .input('id', sql.Int, auctionId)
                .query('DELETE FROM Auctions WHERE auction_id = @id');

            // Delete Product
            await pool.request()
                .input('id', sql.Int, product_id)
                .query('DELETE FROM Products WHERE product_id = @id');

            res.json({ message: 'Xóa thành công!' });
        } catch (err) {
            console.error('Error deleting auction:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // 7.5. Admin duyệt phiên đấu giá
    app.put('/admin/auctions/:id/approve', async (req, res) => {
        try {
            const auctionId = req.params.id;

            // Check if auction exists and is PENDING
            const checkResult = await pool.request()
                .input('id', sql.Int, auctionId)
                .query('SELECT status FROM Auctions WHERE auction_id = @id');

            if (checkResult.recordset.length === 0) {
                return res.status(404).json({ message: 'Không tìm thấy phiên đấu giá' });
            }

            if (checkResult.recordset[0].status !== 'PENDING') {
                return res.status(400).json({ message: 'Phiên đấu giá không ở trạng thái chờ duyệt' });
            }

            // Approve auction
            await pool.request()
                .input('id', sql.Int, auctionId)
                .query(`UPDATE Auctions SET status = 'ACTIVE' WHERE auction_id = @id`);

            res.json({ message: 'Đã duyệt phiên đấu giá thành công!', success: true });
        } catch (err) {
            console.error('Error approving auction:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // 7.6. Admin từ chối phiên đấu giá
    app.put('/admin/auctions/:id/reject', async (req, res) => {
        try {
            const auctionId = req.params.id;

            // Check if auction exists and is PENDING
            const checkResult = await pool.request()
                .input('id', sql.Int, auctionId)
                .query('SELECT status FROM Auctions WHERE auction_id = @id');

            if (checkResult.recordset.length === 0) {
                return res.status(404).json({ message: 'Không tìm thấy phiên đấu giá' });
            }

            if (checkResult.recordset[0].status !== 'PENDING') {
                return res.status(400).json({ message: 'Phiên đấu giá không ở trạng thái chờ duyệt' });
            }

            // Reject auction
            await pool.request()
                .input('id', sql.Int, auctionId)
                .query(`UPDATE Auctions SET status = 'CANCELLED' WHERE auction_id = @id`);

            res.json({ message: 'Đã từ chối phiên đấu giá', success: true });
        } catch (err) {
            console.error('Error rejecting auction:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // 8. User Dashboard Data
    app.get('/user/:userId/dashboard', async (req, res) => {
        try {
            const userId = req.params.userId;

            // Stats
            const statsResult = await pool.request()
                .input('uid', sql.Int, userId)
                .query(`
                    SELECT 
                        COUNT(DISTINCT CASE WHEN a.status = 'ACTIVE' THEN b.auction_id END) AS activeBids,
                        COUNT(DISTINCT CASE WHEN a.highest_bidder_id = @uid AND a.status = 'COMPLETED' THEN a.auction_id END) AS wonAuctions,
                        0 AS watching,
                        ISNULL(SUM(CASE WHEN a.highest_bidder_id = @uid AND a.status = 'COMPLETED' THEN a.current_price ELSE 0 END), 0) AS totalSpent
                    FROM Bids b
                    LEFT JOIN Auctions a ON b.auction_id = a.auction_id
                    WHERE b.bidder_id = @uid
                `);

            // Recent bids
            const bidsResult = await pool.request()
                .input('uid', sql.Int, userId)
                .query(`
                    SELECT TOP 5
                        p.product_name AS product,
                        p.image_url,
                        b.bid_amount AS price,
                        a.status,
                        b.bid_time AS time,
                        a.auction_id
                    FROM Bids b
                    INNER JOIN Auctions a ON b.auction_id = a.auction_id
                    INNER JOIN Products p ON a.product_id = p.product_id
                    WHERE b.bidder_id = @uid
                    ORDER BY b.bid_time DESC
                `);

            res.json({
                activeBids: statsResult.recordset[0].activeBids,
                wonAuctions: statsResult.recordset[0].wonAuctions,
                watching: statsResult.recordset[0].watching,
                totalSpent: statsResult.recordset[0].totalSpent,
                recentBids: bidsResult.recordset
            });
        } catch (err) {
            console.error('Error fetching dashboard:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // 9. Admin Stats
    app.get('/admin/stats', async (req, res) => {
        try {
            const result = await pool.request().query(`
                SELECT 
                    COUNT(CASE WHEN status = 'ACTIVE' AND start_time <= GETDATE() AND end_time > GETDATE() THEN 1 END) AS active,
                    COUNT(CASE WHEN status = 'ACTIVE' AND start_time > GETDATE() THEN 1 END) AS waitingToStart,
                    COUNT(CASE WHEN status = 'PENDING' THEN 1 END) AS pending,
                    ISNULL(SUM(CASE WHEN status = 'ACTIVE' AND start_time <= GETDATE() THEN current_price ELSE 0 END), 0) AS totalValue,
                    0 AS fraudAlerts
                FROM Auctions
            `);

            res.json(result.recordset[0]);
        } catch (err) {
            console.error('Error fetching admin stats:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // API: Get recent activities for admin dashboard
    app.get('/admin/recent-activities', async (req, res) => {
        try {
            const result = await pool.request().query(`
                SELECT TOP 10
                    b.bid_id,
                    COALESCE(u.full_name, u.username) as user_name,
                    p.product_name,
                    b.bid_amount,
                    b.bid_time,
                    a.auction_id
                FROM Bids b
                INNER JOIN Users u ON b.bidder_id = u.user_id
                INNER JOIN Auctions a ON b.auction_id = a.auction_id
                INNER JOIN Products p ON a.product_id = p.product_id
                ORDER BY b.bid_time DESC
            `);

            res.json({ success: true, activities: result.recordset });
        } catch (err) {
            console.error('Error fetching recent activities:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // API: Get system alerts for admin
    app.get('/admin/alerts', async (req, res) => {
        try {
            const result = await pool.request().query(`
                SELECT TOP 5
                    CASE 
                        WHEN DATEDIFF(MINUTE, end_time, GETDATE()) <= 5 THEN N'Phiên đấu giá vừa kết thúc'
                        WHEN DATEDIFF(MINUTE, GETDATE(), start_time) <= 10 AND DATEDIFF(MINUTE, GETDATE(), start_time) >= 0 THEN N'Phiên đấu giá sắp bắt đầu'
                        WHEN total_bids > 50 THEN N'Phiên đấu giá HOT'
                        ELSE N'Phiên đấu giá mới'
                    END as alert_type,
                    p.product_name,
                    a.total_bids,
                    a.current_price,
                    a.start_time,
                    a.end_time,
                    a.auction_id
                FROM Auctions a
                INNER JOIN Products p ON a.product_id = p.product_id
                WHERE a.status = 'ACTIVE'
                ORDER BY a.created_at DESC
            `);

            res.json({ success: true, alerts: result.recordset });
        } catch (err) {
            console.error('Error fetching alerts:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // API: Get all users for admin
    app.get('/admin/users', async (req, res) => {
        try {
            const result = await pool.request().query(`
                SELECT 
                    u.user_id,
                    u.username,
                    COALESCE(u.full_name, u.username) as full_name,
                    u.email,
                    u.phone_number,
                    u.role_id,
                    u.created_at,
                    u.avatar_url,
                    (SELECT COUNT(*) FROM Auctions a INNER JOIN Products p ON a.product_id = p.product_id WHERE p.seller_id = u.user_id) as total_auctions,
                    (SELECT COUNT(*) FROM Bids WHERE bidder_id = u.user_id) as total_bids
                FROM Users u
                ORDER BY u.created_at DESC
            `);

            res.json({ success: true, users: result.recordset });
        } catch (err) {
            console.error('Error fetching users:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // API: Get fraud reports
    app.get('/admin/fraud-reports', async (req, res) => {
        try {
            const result = await pool.request().query(`
                SELECT TOP 20
                    u.user_id,
                    COALESCE(u.full_name, u.username) as user_name,
                    u.email,
                    COUNT(DISTINCT b.auction_id) as auctions_participated,
                    COUNT(b.bid_id) as total_bids,
                    AVG(CAST(b.bid_amount as FLOAT)) as avg_bid_amount,
                    MAX(b.bid_amount) as max_bid_amount,
                    CASE 
                        WHEN COUNT(b.bid_id) > 100 THEN N'Cao'
                        WHEN COUNT(b.bid_id) > 50 THEN N'Trung bình'
                        ELSE N'Thấp'
                    END as risk_level
                FROM Users u
                LEFT JOIN Bids b ON u.user_id = b.bidder_id
                WHERE u.role_id != 1
                GROUP BY u.user_id, u.full_name, u.username, u.email
                HAVING COUNT(b.bid_id) > 0
                ORDER BY COUNT(b.bid_id) DESC
            `);

            res.json({ success: true, reports: result.recordset });
        } catch (err) {
            console.error('Error fetching fraud reports:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // API: Get statistics reports
    app.get('/admin/statistics', async (req, res) => {
        try {
            const result = await pool.request().query(`
                SELECT 
                    (SELECT COUNT(*) FROM Users WHERE role_id != 1) as total_users,
                    (SELECT COUNT(*) FROM Auctions) as total_auctions,
                    (SELECT COUNT(*) FROM Auctions WHERE status = 'COMPLETED') as completed_auctions,
                    (SELECT COUNT(*) FROM Bids) as total_bids,
                    (SELECT ISNULL(SUM(current_price), 0) FROM Auctions WHERE status = 'COMPLETED') as total_revenue,
                    (SELECT AVG(CAST(total_bids as FLOAT)) FROM Auctions WHERE status = 'COMPLETED') as avg_bids_per_auction
            `);

            // Get revenue by month
            const monthlyRevenue = await pool.request().query(`
                SELECT 
                    FORMAT(end_time, 'yyyy-MM') as month,
                    COUNT(*) as auction_count,
                    SUM(current_price) as total_amount
                FROM Auctions
                WHERE status = 'COMPLETED' AND end_time >= DATEADD(MONTH, -6, GETDATE())
                GROUP BY FORMAT(end_time, 'yyyy-MM')
                ORDER BY month DESC
            `);

            // Get top categories
            const topCategories = await pool.request().query(`
                SELECT TOP 5
                    c.category_name,
                    COUNT(a.auction_id) as auction_count,
                    SUM(a.total_bids) as total_bids
                FROM Categories c
                LEFT JOIN Products p ON c.category_id = p.category_id
                LEFT JOIN Auctions a ON p.product_id = a.product_id
                GROUP BY c.category_name
                ORDER BY COUNT(a.auction_id) DESC
            `);

            res.json({ 
                success: true, 
                statistics: result.recordset[0],
                monthlyRevenue: monthlyRevenue.recordset,
                topCategories: topCategories.recordset
            });
        } catch (err) {
            console.error('Error fetching statistics:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // 10. Search API
    app.get('/search', async (req, res) => {
        try {
            const { q, category, min_price, max_price, status } = req.query;

            let query = `
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
                    a.total_bids
                FROM Auctions a
                INNER JOIN Products p ON a.product_id = p.product_id
                INNER JOIN Users u ON p.seller_id = u.user_id
                WHERE 1=1
            `;

            const request = pool.request();

            if (q) {
                query += ` AND (p.product_name LIKE @query OR p.description LIKE @query)`;
                request.input('query', sql.NVarChar, `%${q}%`);
            }

            if (category) {
                query += ` AND p.category_id = @category`;
                request.input('category', sql.Int, category);
            }

            if (min_price) {
                query += ` AND a.current_price >= @min_price`;
                request.input('min_price', sql.Decimal(15, 2), min_price);
            }

            if (max_price) {
                query += ` AND a.current_price <= @max_price`;
                request.input('max_price', sql.Decimal(15, 2), max_price);
            }

            if (status) {
                query += ` AND a.status = @status`;
                request.input('status', sql.VarChar, status);
            }

            query += ` ORDER BY a.start_time DESC`;

            const result = await request.query(query);
            res.json({ auctions: result.recordset });
        } catch (err) {
            console.error('Search error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // 11. Newsletter Subscription
    app.post('/newsletter/subscribe', async (req, res) => {
        try {
            const { email } = req.body;

            if (!email || !email.includes('@')) {
                return res.status(400).json({ error: 'Email không hợp lệ' });
            }

            // Check if email already exists
            const checkResult = await pool.request()
                .input('email', sql.VarChar, email)
                .query('SELECT email FROM Newsletter WHERE email = @email');

            if (checkResult.recordset.length > 0) {
                return res.status(200).json({ message: 'Email đã được đăng ký trước đó' });
            }

            // Insert new subscriber
            await pool.request()
                .input('email', sql.VarChar, email)
                .query('INSERT INTO Newsletter (email, subscribed_at) VALUES (@email, GETDATE())');

            res.json({ message: 'Đăng ký nhận tin thành công!' });
        } catch (err) {
            console.error('Newsletter subscription error:', err);
            res.status(500).json({ error: 'Không thể đăng ký nhận tin' });
        }
    });

    // 12. Lấy notifications của user
    app.get('/notifications/:userId', async (req, res) => {
        try {
            const userId = req.params.userId;
            const { limit = 20 } = req.query;

            const result = await pool.request()
                .input('userId', sql.Int, userId)
                .input('limit', sql.Int, parseInt(limit))
                .query(`
                    SELECT TOP (@limit)
                        n.notification_id,
                        n.notification_type,
                        n.title,
                        n.message,
                        n.is_read,
                        n.created_at,
                        n.auction_id,
                        a.auction_id,
                        p.product_name AS auction_title
                    FROM Notifications n
                    LEFT JOIN Auctions a ON n.auction_id = a.auction_id
                    LEFT JOIN Products p ON a.product_id = p.product_id
                    WHERE n.user_id = @userId
                    ORDER BY n.created_at DESC
                `);

            res.json({ notifications: result.recordset });
        } catch (err) {
            console.error('Error fetching notifications:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // 13. Đánh dấu notification đã đọc
    app.put('/notifications/:notificationId/read', async (req, res) => {
        try {
            const notificationId = req.params.notificationId;

            await pool.request()
                .input('id', sql.Int, notificationId)
                .query('UPDATE Notifications SET is_read = 1 WHERE notification_id = @id');

            res.json({ message: 'Đã đánh dấu đã đọc' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 14. Đánh dấu tất cả notifications đã đọc
    app.put('/notifications/user/:userId/read-all', async (req, res) => {
        try {
            const userId = req.params.userId;

            await pool.request()
                .input('userId', sql.Int, userId)
                .query('UPDATE Notifications SET is_read = 1 WHERE user_id = @userId AND is_read = 0');

            res.json({ message: 'Đã đánh dấu tất cả đã đọc' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // --- REALTIME SOCKET.IO ---
    const server = http.createServer(app);
    const io = new Server(server, {
        cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        socket.on('join_auction', (auction_id) => {
            socket.join(auction_id);
        });

        socket.on('send_bid', async (data) => {
            try {
                // Get current highest bidder trước khi insert bid mới
                const currentAuction = await pool.request()
                    .input('auc_id', sql.Int, data.auction_id)
                    .query('SELECT highest_bidder_id, current_price FROM Auctions WHERE auction_id = @auc_id');
                
                const prevHighestBidder = currentAuction.recordset[0]?.highest_bidder_id;

                // Insert bid into database
                // Trigger trg_UpdateBidCount will automatically update:
                // - Auctions.current_price
                // - Auctions.total_bids
                // - Auctions.highest_bidder_id
                await pool.request()
                    .input('auc_id', sql.Int, data.auction_id)
                    .input('uid', sql.Int, data.user_id)
                    .input('amount', sql.Decimal(15, 2), data.amount)
                    .query("INSERT INTO Bids (auction_id, bidder_id, bid_amount) VALUES (@auc_id, @uid, @amount)");

                // Tạo notification cho người bị outbid
                if (prevHighestBidder && prevHighestBidder !== data.user_id) {
                    await pool.request()
                        .input('userId', sql.Int, prevHighestBidder)
                        .input('auctionId', sql.Int, data.auction_id)
                        .input('title', sql.NVarChar, 'Bạn đã bị vượt giá!')
                        .input('message', sql.NVarChar, `Ai đó đã đặt giá ${data.amount.toLocaleString('vi-VN')} VNĐ cao hơn bạn`)
                        .query(`
                            INSERT INTO Notifications (user_id, auction_id, notification_type, title, message, is_read, created_at)
                            VALUES (@userId, @auctionId, 'outbid', @title, @message, 0, GETDATE())
                        `);
                    
                    // Emit notification event đến user bị outbid
                    io.emit(`notification_${prevHighestBidder}`, {
                        type: 'outbid',
                        auction_id: data.auction_id,
                        message: `Bạn đã bị vượt giá ở phiên đấu giá #${data.auction_id}`
                    });
                }

                // Emit to all clients in the auction room
                io.to(data.auction_id).emit('receive_bid', data);
            } catch (err) {
                console.error("Lỗi đặt giá:", err);
                socket.emit('bid_error', { message: 'Không thể đặt giá, vui lòng thử lại' });
            }
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });

    // API: Update user profile
    app.put('/user/:userId/profile', async (req, res) => {
        try {
            const { userId } = req.params;
            const { email, full_name, phone_number } = req.body;

            await pool.request()
                .input('userId', sql.Int, userId)
                .input('email', sql.VarChar, email)
                .input('full_name', sql.NVarChar, full_name)
                .input('phone_number', sql.VarChar, phone_number)
                .query(`
                    UPDATE Users 
                    SET email = @email, 
                        full_name = @full_name, 
                        phone_number = @phone_number
                    WHERE user_id = @userId
                `);

            res.json({ message: 'Cập nhật thông tin thành công' });
        } catch (err) {
            console.error('Error updating user profile:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // API: Get user bid history
    app.get('/bids/user/:userId', async (req, res) => {
        try {
            const { userId } = req.params;

            const result = await pool.request()
                .input('userId', sql.Int, userId)
                .query(`
                    SELECT 
                        b.bid_id,
                        b.auction_id,
                        b.bid_amount,
                        b.bid_time,
                        a.current_price,
                        a.status,
                        a.highest_bidder_id,
                        CASE WHEN a.highest_bidder_id = b.bidder_id THEN 1 ELSE 0 END AS is_highest_bidder,
                        p.product_name,
                        p.image_url,
                        a.end_time
                    FROM Bids b
                    INNER JOIN Auctions a ON b.auction_id = a.auction_id
                    INNER JOIN Products p ON a.product_id = p.product_id
                    WHERE b.bidder_id = @userId
                    ORDER BY b.bid_time DESC
                `);

            res.json({ bids: result.recordset });
        } catch (err) {
            console.error('Error fetching bid history:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // API: Get user's active bids (auctions user is participating)
    app.get('/user/:userId/bids', async (req, res) => {
        try {
            const { userId } = req.params;

            const result = await pool.request()
                .input('userId', sql.Int, userId)
                .query(`
                    SELECT DISTINCT
                        b.auction_id,
                        b.bid_amount,
                        b.bid_time,
                        a.current_price,
                        a.status,
                        a.highest_bidder_id,
                        p.product_name,
                        p.image_url,
                        a.end_time
                    FROM Bids b
                    INNER JOIN Auctions a ON b.auction_id = a.auction_id
                    INNER JOIN Products p ON a.product_id = p.product_id
                    WHERE b.bidder_id = @userId
                    AND a.status = 'ACTIVE'
                    ORDER BY b.bid_time DESC
                `);

            res.json({ success: true, bids: result.recordset });
        } catch (err) {
            console.error('Error fetching user bids:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // API: Get user's watchlist
    app.get('/user/:userId/watchlist', async (req, res) => {
        try {
            const { userId } = req.params;

            const result = await pool.request()
                .input('userId', sql.Int, userId)
                .query(`
                    SELECT 
                        w.watchlist_id,
                        w.auction_id,
                        w.added_at,
                        a.product_id,
                        a.current_price,
                        a.status,
                        a.end_time,
                        a.total_bids,
                        p.product_name,
                        p.image_url
                    FROM Watchlist w
                    INNER JOIN Auctions a ON w.auction_id = a.auction_id
                    INNER JOIN Products p ON a.product_id = p.product_id
                    WHERE w.user_id = @userId
                    ORDER BY w.added_at DESC
                `);

            res.json({ success: true, watchlist: result.recordset });
        } catch (err) {
            console.error('Error fetching watchlist:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // API: Add to watchlist
    app.post('/user/:userId/watchlist/:auctionId', async (req, res) => {
        try {
            const { userId, auctionId } = req.params;

            // Check if already in watchlist
            const checkResult = await pool.request()
                .input('userId', sql.Int, userId)
                .input('auctionId', sql.Int, auctionId)
                .query(`
                    SELECT watchlist_id FROM Watchlist 
                    WHERE user_id = @userId AND auction_id = @auctionId
                `);

            if (checkResult.recordset.length > 0) {
                return res.json({ success: false, message: 'Đã có trong danh sách theo dõi' });
            }

            await pool.request()
                .input('userId', sql.Int, userId)
                .input('auctionId', sql.Int, auctionId)
                .query(`
                    INSERT INTO Watchlist (user_id, auction_id, added_at)
                    VALUES (@userId, @auctionId, GETDATE())
                `);

            res.json({ success: true, message: 'Đã thêm vào danh sách theo dõi' });
        } catch (err) {
            console.error('Error adding to watchlist:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // API: Remove from watchlist
    app.delete('/user/:userId/watchlist/:auctionId', async (req, res) => {
        try {
            const { userId, auctionId } = req.params;

            await pool.request()
                .input('userId', sql.Int, userId)
                .input('auctionId', sql.Int, auctionId)
                .query(`
                    DELETE FROM Watchlist 
                    WHERE user_id = @userId AND auction_id = @auctionId
                `);

            res.json({ success: true, message: 'Đã xóa khỏi danh sách theo dõi' });
        } catch (err) {
            console.error('Error removing from watchlist:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // API: Check if auction is in watchlist
    app.get('/user/:userId/watchlist/check/:auctionId', async (req, res) => {
        try {
            const { userId, auctionId } = req.params;

            const result = await pool.request()
                .input('userId', sql.Int, userId)
                .input('auctionId', sql.Int, auctionId)
                .query(`
                    SELECT watchlist_id FROM Watchlist 
                    WHERE user_id = @userId AND auction_id = @auctionId
                `);

            res.json({ success: true, inWatchlist: result.recordset.length > 0 });
        } catch (err) {
            console.error('Error checking watchlist:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // API: Upload avatar
    app.post('/user/:userId/avatar', upload.single('avatar'), async (req, res) => {
        try {
            const { userId } = req.params;

            if (!req.file) {
                return res.status(400).json({ success: false, message: 'Không có file ảnh' });
            }

            const avatarUrl = `http://localhost:3001/uploads/${req.file.filename}`;

            await pool.request()
                .input('userId', sql.Int, userId)
                .input('avatarUrl', sql.NVarChar, avatarUrl)
                .query(`
                    UPDATE Users 
                    SET avatar_url = @avatarUrl 
                    WHERE user_id = @userId
                `);

            res.json({ 
                success: true, 
                message: 'Cập nhật avatar thành công',
                avatarUrl: avatarUrl
            });
        } catch (err) {
            console.error('Error uploading avatar:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // ============================================================================
    // MY AUCTIONS APIs (Seller Dashboard)
    // ============================================================================

    // API: Get seller's auctions (quản lý tin bán)
    app.get('/user/:userId/selling-auctions', async (req, res) => {
        try {
            const { userId } = req.params;
            const { status } = req.query; // ACTIVE, PENDING, COMPLETED, CANCELLED, WAITING

            let statusFilter = '';
            if (status && status !== 'all') {
                if (status === 'WAITING') {
                    // Đã duyệt nhưng chưa đến ngày lên sàn
                    statusFilter = 'AND a.status = @activeStatus AND a.start_time > GETDATE()';
                } else if (status === 'ACTIVE') {
                    // Đang diễn ra (đã đến ngày lên sàn)
                    statusFilter = 'AND a.status = @status AND a.start_time <= GETDATE()';
                } else {
                    statusFilter = 'AND a.status = @status';
                }
            }

            const request = pool.request()
                .input('userId', sql.Int, userId);

            if (status && status !== 'all') {
                if (status === 'WAITING') {
                    request.input('activeStatus', sql.VarChar, 'ACTIVE');
                } else {
                    request.input('status', sql.VarChar, status);
                }
            }

            const result = await request.query(`
                SELECT 
                    a.auction_id,
                    a.current_price,
                    a.status,
                    a.start_time,
                    a.end_time,
                    a.total_bids,
                    a.highest_bidder_id,
                    a.transaction_completed,
                    a.completed_at,
                    p.product_id,
                    p.product_name,
                    p.description,
                    p.starting_price,
                    p.image_url,
                    p.created_at,
                    -- Highest bidder info
                    u.username as highest_bidder_username,
                    u.full_name as highest_bidder_fullname,
                    u.email as highest_bidder_email,
                    u.phone_number as highest_bidder_phone,
                    u.avatar_url as highest_bidder_avatar
                FROM Auctions a
                INNER JOIN Products p ON a.product_id = p.product_id
                LEFT JOIN Users u ON a.highest_bidder_id = u.user_id
                WHERE p.seller_id = @userId
                ${statusFilter}
                ORDER BY a.created_at DESC
            `);

            res.json({ success: true, auctions: result.recordset });
        } catch (err) {
            console.error('Error fetching selling auctions:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // API: Get auction winner details (thông tin người thắng)
    app.get('/auction/:auctionId/winner', async (req, res) => {
        try {
            const { auctionId } = req.params;

            const result = await pool.request()
                .input('auctionId', sql.Int, auctionId)
                .query(`
                    SELECT 
                        a.auction_id,
                        a.current_price as winning_price,
                        a.status,
                        a.end_time,
                        a.transaction_completed,
                        a.completed_at,
                        p.product_name,
                        p.starting_price,
                        -- Winner info
                        u.user_id as winner_id,
                        u.username as winner_username,
                        u.full_name as winner_fullname,
                        u.email as winner_email,
                        u.phone_number as winner_phone,
                        u.avatar_url as winner_avatar,
                        u.trust_score as winner_trust_score
                    FROM Auctions a
                    INNER JOIN Products p ON a.product_id = p.product_id
                    LEFT JOIN Users u ON a.highest_bidder_id = u.user_id
                    WHERE a.auction_id = @auctionId
                    AND a.status = 'COMPLETED'
                `);

            if (result.recordset.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Phiên đấu giá chưa kết thúc hoặc không có người thắng' 
                });
            }

            res.json({ success: true, winner: result.recordset[0] });
        } catch (err) {
            console.error('Error fetching winner details:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // API: Mark transaction as completed (đánh dấu đã hoàn thành giao dịch)
    app.put('/auction/:auctionId/complete-transaction', async (req, res) => {
        try {
            const { auctionId } = req.params;

            await pool.request()
                .input('auctionId', sql.Int, auctionId)
                .query(`
                    UPDATE Auctions 
                    SET transaction_completed = 1,
                        completed_at = GETDATE()
                    WHERE auction_id = @auctionId
                    AND status = 'COMPLETED'
                `);

            res.json({ 
                success: true, 
                message: 'Đã đánh dấu giao dịch hoàn thành' 
            });
        } catch (err) {
            console.error('Error completing transaction:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // API: Cancel auction (hủy phiên đấu giá - chỉ khi chưa có người đặt giá)
    app.put('/auction/:auctionId/cancel', async (req, res) => {
        try {
            const { auctionId } = req.params;
            const { reason } = req.body;

            // Check if auction has bids
            const checkBids = await pool.request()
                .input('auctionId', sql.Int, auctionId)
                .query(`
                    SELECT COUNT(*) as bid_count
                    FROM Bids
                    WHERE auction_id = @auctionId
                `);

            if (checkBids.recordset[0].bid_count > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Không thể hủy phiên đã có người đặt giá' 
                });
            }

            await pool.request()
                .input('auctionId', sql.Int, auctionId)
                .query(`
                    UPDATE Auctions 
                    SET status = 'CANCELLED'
                    WHERE auction_id = @auctionId
                `);

            res.json({ 
                success: true, 
                message: 'Đã hủy phiên đấu giá' 
            });
        } catch (err) {
            console.error('Error cancelling auction:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // ============================================================================
    // MESSAGING APIs (Chat giữa seller-buyer)
    // ============================================================================

    // API: Get user notifications
    app.get('/notifications/:userId', async (req, res) => {
        try {
            const { userId } = req.params;
            const limit = req.query.limit || 50;

            const result = await pool.request()
                .input('userId', sql.Int, userId)
                .input('limit', sql.Int, limit)
                .query(`
                    SELECT TOP (@limit)
                        n.notification_id,
                        n.notification_type,
                        n.title,
                        n.message,
                        n.auction_id,
                        n.is_read,
                        n.created_at,
                        a.auction_id,
                        p.product_name AS auction_title
                    FROM Notifications n
                    LEFT JOIN Auctions a ON n.auction_id = a.auction_id
                    LEFT JOIN Products p ON a.product_id = p.product_id
                    WHERE n.user_id = @userId
                    ORDER BY n.created_at DESC
                `);

            res.json({
                success: true,
                notifications: result.recordset
            });
        } catch (err) {
            console.error('Error fetching notifications:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // API: Mark notification as read
    app.put('/notifications/:notificationId/read', async (req, res) => {
        try {
            const { notificationId } = req.params;

            await pool.request()
                .input('id', sql.Int, notificationId)
                .query(`
                    UPDATE Notifications
                    SET is_read = 1
                    WHERE notification_id = @id
                `);

            res.json({ success: true });
        } catch (err) {
            console.error('Error marking notification as read:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // API: Mark all notifications as read
    app.put('/notifications/:userId/read-all', async (req, res) => {
        try {
            const { userId } = req.params;

            await pool.request()
                .input('userId', sql.Int, userId)
                .query(`
                    UPDATE Notifications
                    SET is_read = 1
                    WHERE user_id = @userId AND is_read = 0
                `);

            res.json({ success: true });
        } catch (err) {
            console.error('Error marking all as read:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // API: Get user's conversations (danh sách cuộc trò chuyện)
    app.get('/messages/:userId/conversations', async (req, res) => {
        try {
            const { userId } = req.params;

            const result = await pool.request()
                .input('userId', sql.Int, userId)
                .query(`
                    WITH LatestMessages AS (
                        SELECT 
                            CASE 
                                WHEN sender_id = @userId THEN receiver_id
                                ELSE sender_id
                            END as other_user_id,
                            MAX(sent_at) as last_message_time
                        FROM Messages
                        WHERE sender_id = @userId OR receiver_id = @userId
                        GROUP BY 
                            CASE 
                                WHEN sender_id = @userId THEN receiver_id
                                ELSE sender_id
                            END
                    )
                    SELECT 
                        lm.other_user_id,
                        u.username,
                        u.full_name,
                        u.email,
                        u.avatar_url,
                        lm.last_message_time,
                        m.message_content as last_message,
                        m.sender_id as last_sender_id,
                        -- Count unread messages
                        (SELECT COUNT(*) 
                         FROM Messages 
                         WHERE sender_id = lm.other_user_id 
                         AND receiver_id = @userId 
                         AND is_read = 0) as unread_count
                    FROM LatestMessages lm
                    INNER JOIN Users u ON lm.other_user_id = u.user_id
                    LEFT JOIN Messages m ON m.sent_at = lm.last_message_time
                        AND (m.sender_id = @userId OR m.receiver_id = @userId)
                    ORDER BY lm.last_message_time DESC
                `);

            res.json({ success: true, conversations: result.recordset });
        } catch (err) {
            console.error('Error fetching conversations:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // API: Get messages between two users
    app.get('/messages/:userId/:otherUserId', async (req, res) => {
        try {
            const { userId, otherUserId } = req.params;
            const { limit = 50 } = req.query;

            const result = await pool.request()
                .input('userId', sql.Int, userId)
                .input('otherUserId', sql.Int, otherUserId)
                .input('limit', sql.Int, limit)
                .query(`
                    SELECT TOP (@limit)
                        m.message_id,
                        m.sender_id,
                        m.receiver_id,
                        m.auction_id,
                        m.message_content,
                        m.is_read,
                        m.sent_at,
                        sender.username as sender_username,
                        sender.full_name as sender_fullname,
                        sender.avatar_url as sender_avatar,
                        p.product_name as auction_product_name
                    FROM Messages m
                    INNER JOIN Users sender ON m.sender_id = sender.user_id
                    LEFT JOIN Auctions a ON m.auction_id = a.auction_id
                    LEFT JOIN Products p ON a.product_id = p.product_id
                    WHERE (m.sender_id = @userId AND m.receiver_id = @otherUserId)
                       OR (m.sender_id = @otherUserId AND m.receiver_id = @userId)
                    ORDER BY m.sent_at DESC
                `);

            // Mark messages as read
            await pool.request()
                .input('userId', sql.Int, userId)
                .input('otherUserId', sql.Int, otherUserId)
                .query(`
                    UPDATE Messages 
                    SET is_read = 1
                    WHERE sender_id = @otherUserId 
                    AND receiver_id = @userId
                    AND is_read = 0
                `);

            res.json({ 
                success: true, 
                messages: result.recordset.reverse() // Oldest first
            });
        } catch (err) {
            console.error('Error fetching messages:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // API: Send message
    app.post('/messages', async (req, res) => {
        try {
            const { sender_id, receiver_id, auction_id, message_content } = req.body;

            const result = await pool.request()
                .input('senderId', sql.Int, sender_id)
                .input('receiverId', sql.Int, receiver_id)
                .input('auctionId', sql.Int, auction_id || null)
                .input('content', sql.NVarChar, message_content)
                .query(`
                    INSERT INTO Messages (sender_id, receiver_id, auction_id, message_content, sent_at)
                    OUTPUT INSERTED.*
                    VALUES (@senderId, @receiverId, @auctionId, @content, GETDATE())
                `);

            const newMessage = result.recordset[0];

            // Lấy thông tin người gửi để tạo notification
            const senderInfo = await pool.request()
                .input('senderId', sql.Int, sender_id)
                .query(`
                    SELECT COALESCE(full_name, username) AS name
                    FROM Users
                    WHERE user_id = @senderId
                `);

            const senderName = senderInfo.recordset[0]?.name || 'Người dùng';

            // Tạo notification cho người nhận
            const notifResult = await pool.request()
                .input('userId', sql.Int, receiver_id)
                .input('type', sql.VarChar, 'message')
                .input('title', sql.NVarChar, 'Tin nhắn mới')
                .input('message', sql.NVarChar, `${senderName}: ${message_content.substring(0, 50)}${message_content.length > 50 ? '...' : ''}`)
                .input('auctionId', sql.Int, auction_id || null)
                .query(`
                    INSERT INTO Notifications (user_id, notification_type, title, message, auction_id, is_read, created_at)
                    OUTPUT INSERTED.*
                    VALUES (@userId, @type, @title, @message, @auctionId, 0, GETDATE())
                `);

            // Emit socket notification
            io.to(`user_${receiver_id}`).emit('new_notification', {
                notification_id: notifResult.recordset[0].notification_id,
                notification_type: 'message',
                title: 'Tin nhắn mới',
                message: `${senderName}: ${message_content.substring(0, 50)}${message_content.length > 50 ? '...' : ''}`,
                created_at: notifResult.recordset[0].created_at
            });

            // Emit socket event for real-time
            io.to(`user_${receiver_id}`).emit('new_message', {
                message_id: newMessage.message_id,
                sender_id: newMessage.sender_id,
                receiver_id: newMessage.receiver_id,
                auction_id: newMessage.auction_id,
                message_content: newMessage.message_content,
                sent_at: newMessage.sent_at
            });

            res.json({ 
                success: true, 
                message: newMessage
            });
        } catch (err) {
            console.error('Error sending message:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // API: Get unread message count
    app.get('/messages/:userId/unread-count', async (req, res) => {
        try {
            const { userId } = req.params;

            const result = await pool.request()
                .input('userId', sql.Int, userId)
                .query(`
                    SELECT COUNT(*) as unread_count
                    FROM Messages
                    WHERE receiver_id = @userId
                    AND is_read = 0
                `);

            res.json({ 
                success: true, 
                unread_count: result.recordset[0].unread_count 
            });
        } catch (err) {
            console.error('Error fetching unread count:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    server.listen(3001, () => {
        console.log("🚀 Server chạy tại port 3001");
        
        // Run auto-complete check every minute
        setInterval(() => {
            autoCompleteAuctions(pool);
        }, 60000); // 60 seconds
        
        // Initial check on startup
        autoCompleteAuctions(pool);
    });

}).catch(err => {
    console.error("❌ Lỗi kết nối SQL Server:", err.message);
    console.log("Gợi ý: Hãy kiểm tra xem bạn đã bật TCP/IP trong 'Sql Server Configuration Manager' chưa?");
});