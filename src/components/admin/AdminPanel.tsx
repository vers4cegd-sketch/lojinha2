import React, { useState } from 'react';
import { useEffect } from 'react';
import AdminLayout from './AdminLayout';
import AdminLogin from './AdminLogin';
import Dashboard from './Dashboard';
import ProductsManager from './ProductsManager';
import CategoriesManager from './CategoriesManager';
import BannerLibrary from './BannerLibrary';
import SkinsImporter from './SkinsImporter';
import SkinsManager from './SkinsManager';
import VandalLibrary from './VandalLibrary';
import ImplementSkins from './ImplementSkins';
import UsersManager from './UsersManager';
import Settings from './Settings';

const AdminPanel: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Desabilitar Google Analytics na área admin
  useEffect(() => {
    // Pausar o Google Analytics quando estiver no admin
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'AW-17591894551', {
        send_page_view: false
      });
    }
  }, []);

  useEffect(() => {
    // Verificar se há sessão salva no localStorage
    const savedAuth = localStorage.getItem('admin_authenticated');
    
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
    
    setIsLoading(false);
  }, []);

  const handleLogin = () => {
    // Salvar autenticação no localStorage
    localStorage.setItem('admin_authenticated', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    // Limpar dados de autenticação
    localStorage.removeItem('admin_authenticated');
    setIsAuthenticated(false);
    setActiveTab('dashboard');
  };

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-white">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'products':
        return <ProductsManager />;
      case 'categories':
        return <CategoriesManager />;
      case 'banner-library':
        return <BannerLibrary />;
      case 'skins-importer':
        return <SkinsImporter />;
      case 'skins-manager':
        return <SkinsManager />;
      case 'vandal-library':
        return <VandalLibrary />;
      case 'implement-skins':
        return <ImplementSkins />;
      case 'users':
        return <UsersManager />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AdminLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={handleLogout}
    >
      {renderContent()}
    </AdminLayout>
  );
};

export default AdminPanel;