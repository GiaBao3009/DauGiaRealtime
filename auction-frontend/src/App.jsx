import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import AuctionList from './pages/AuctionList';
import AuctionDetail from './pages/AuctionDetail';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CreateAuction from './pages/CreateAuction';
import EditAuction from './pages/EditAuction';
import UserProfile from './pages/UserProfile';
import BidHistory from './pages/BidHistory';
import MyBids from './pages/MyBids';
import Watchlist from './pages/Watchlist';
import MyAuctions from './pages/MyAuctions';
import Messages from './pages/Messages';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/auctions" element={<AuctionList />} />
          <Route path="/auction/:id" element={<AuctionDetail />} />
          <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/bid-history" element={<ProtectedRoute><BidHistory /></ProtectedRoute>} />
          <Route path="/my-bids" element={<ProtectedRoute><MyBids /></ProtectedRoute>} />
          <Route path="/watchlist" element={<ProtectedRoute><Watchlist /></ProtectedRoute>} />
          <Route path="/my-auctions" element={<ProtectedRoute><MyAuctions /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/messages/:otherUserId" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/create-auction" element={<ProtectedRoute><CreateAuction /></ProtectedRoute>} />
          <Route path="/edit-auction/:id" element={<ProtectedRoute><EditAuction /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;