import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import Orders from './pages/Orders';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import Dashboard from './pages/dashboard/Dashboard';
import AdminLayout from './pages/admin/AdminLayout';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function Layout() {
  const location = useLocation();
  const { settings } = useSettings();
  const siteName = settings.site_name || 'Samuel Store';
  const noShell = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin');
  const noFooter = location.pathname.startsWith('/login') || location.pathname.startsWith('/register') || noShell;

  // Dynamic page title
  useEffect(() => {
    const titles = {
      '/': siteName,
      '/products': `Products — ${siteName}`,
      '/cart': `Cart — ${siteName}`,
      '/checkout': `Checkout — ${siteName}`,
      '/login': `Login — ${siteName}`,
      '/register': `Register — ${siteName}`,
      '/orders': `My Orders — ${siteName}`,
      '/order-confirmation': `Order Confirmed — ${siteName}`,
    };
    const path = location.pathname;
    if (path.startsWith('/products/')) {
      document.title = `Product — ${siteName}`;
    } else if (path.startsWith('/dashboard')) {
      const dashTitles = {
        '/dashboard': `Dashboard — ${siteName}`,
        '/dashboard/orders': `My Orders — ${siteName}`,
        '/dashboard/profile': `Profile — ${siteName}`,
        '/dashboard/addresses': `Addresses — ${siteName}`,
        '/dashboard/reviews': `My Reviews — ${siteName}`,
        '/dashboard/settings': `Settings — ${siteName}`,
      };
      document.title = dashTitles[path] || `Dashboard — ${siteName}`;
    } else if (path.startsWith('/admin')) {
      const adminTitles = {
        '/admin': `Overview — Admin — ${siteName}`,
        '/admin/orders': `Orders — Admin — ${siteName}`,
        '/admin/customers': `Customers — Admin — ${siteName}`,
        '/admin/products': `Products — Admin — ${siteName}`,
        '/admin/categories': `Categories — Admin — ${siteName}`,
        '/admin/inventory': `Inventory — Admin — ${siteName}`,
        '/admin/coupons': `Coupons — Admin — ${siteName}`,
        '/admin/reviews': `Reviews — Admin — ${siteName}`,
        '/admin/banners': `Banners — Admin — ${siteName}`,
        '/admin/reports': `Reports — Admin — ${siteName}`,
        '/admin/settings': `Settings — Admin — ${siteName}`,
      };
      document.title = adminTitles[path] || `Admin — ${siteName}`;
    } else {
      document.title = titles[path] || siteName;
    }
  }, [location.pathname, siteName]);
  return (
    <>
      {!noShell && <Navbar />}
      <Routes>
        <Route path="/admin/*" element={<AdminRoute><AdminLayout /></AdminRoute>} />
        <Route path="/dashboard/*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/order-confirmation" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
      </Routes>
      {!noFooter && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <SettingsProvider>
          <BrowserRouter>
            <Layout />
          </BrowserRouter>
        </SettingsProvider>
      </CartProvider>
    </AuthProvider>
  );
}
