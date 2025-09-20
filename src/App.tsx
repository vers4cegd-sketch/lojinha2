import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import LoginModal from './components/LoginModal';
import HeroSection from './components/HeroSection';
import TrustSection from './components/TrustSection';
import Categories from './components/Categories';
import ProductSection from './components/ProductSection';
import Testimonials from './components/Testimonials';
import DiscordSection from './components/DiscordSection';
import Footer from './components/Footer';
import ValorantPage from './components/ValorantPage';
import EAFCPage from './components/EAFCPage';
import CS2Page from './components/CS2Page';
import AdminPanel from './components/admin/AdminPanel';
import ProductDetailsPage from './components/ProductDetailsPage';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const location = useLocation();

  const handleCategoryClick = (category: string) => {
    setCurrentPage(category);
  };

  const handleLogin = (username: string) => {
    setUser(username);
  };

  const handleLogout = () => {
    setUser(null);
  };

  // Check if we're on admin route
  if (location.pathname.startsWith('/admin')) {
    return <AdminPanel />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'valorant':
        return <ValorantPage onBack={() => setCurrentPage('home')} />;
      case 'ea-fc26':
        return <EAFCPage onBack={() => setCurrentPage('home')} />;
      case 'cs2':
        return <CS2Page onBack={() => setCurrentPage('home')} />;
      default:
        return (
          <>
            <Header 
              user={user}
              onLoginClick={() => setIsLoginModalOpen(true)}
              onLogout={handleLogout}
            />
            <HeroSection />
            <Categories onCategoryClick={handleCategoryClick} />
            <ProductSection />
            <TrustSection />
            <Testimonials />
            <DiscordSection />
            <Footer />
          </>
        );
      case 'product-details':
        return <ProductDetailsPage />;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Routes>
        <Route path="/admin/*" element={<AdminPanel />} />
        <Route path="/produto/:productId" element={<ProductDetailsPage />} />
        <Route path="*" element={
          <>
            <LoginModal
              isOpen={isLoginModalOpen}
              onClose={() => setIsLoginModalOpen(false)}
              onLogin={handleLogin}
            />
            {renderPage()}
          </>
        } />
      </Routes>
    </div>
  );
}

export default App;