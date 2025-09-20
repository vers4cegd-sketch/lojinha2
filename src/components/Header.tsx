import React from 'react';
import { User, LogOut } from 'lucide-react';

interface HeaderProps {
  user: string | null;
  onLoginClick: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLoginClick, onLogout }) => {
  return (
    <header className="bg-black border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-red-600">Traking</h1>
          </div>
          
          <nav className="flex space-x-8">
            <a
              href="#depoimentos"
              className="text-white hover:text-red-500 transition-colors duration-300 hover:underline font-medium"
            >
              DEPOIMENTOS
            </a>
            <a
              href="#perfil"
              className="text-white hover:text-red-500 transition-colors duration-300 hover:underline font-medium"
            >
              PERFIL
            </a>
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-white">
                  <User className="w-5 h-5" />
                  <span className="font-medium">{user}</span>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center space-x-1 text-white hover:text-red-500 transition-colors duration-300 hover:underline font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>SAIR</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="text-white hover:text-red-500 transition-colors duration-300 hover:underline font-medium"
              >
                LOGAR OU CADASTRAR
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;