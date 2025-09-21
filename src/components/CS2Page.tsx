import React, { useState, useEffect } from 'react';
import { RefreshCw, Shield, User, Star, ArrowLeft, ShoppingCart, DollarSign, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CS2PageProps {
  onBack: () => void;
}

const CS2Page: React.FC<CS2PageProps> = ({ onBack }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCS2Products();
  }, []);

  const loadCS2Products = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filtrar apenas produtos de CS2
      const cs2Products = (data || []).filter(product => {
        const categoryName = product.categories?.name?.toLowerCase() || '';
        const productName = product.name.toLowerCase();
        
        return (
          categoryName === 'counter-strike' ||
          categoryName === 'cs2' ||
          categoryName.includes('counter') ||
          productName.includes('cs2') ||
          productName.includes('counter-strike') ||
          productName.includes('counter strike') ||
          productName.includes('csgo') ||
          productName.includes('prime')
        );
      });
      
      setProducts(cs2Products);
    } catch (error) {
      console.error('Erro ao carregar produtos CS2:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTagColor = (tagType: string) => {
    switch (tagType) {
      case 'exclusive':
        return 'bg-white text-black';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Carregando produtos CS2...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <button 
          onClick={onBack}
          className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>VOLTAR</span>
        </button>
      </div>

      {/* Header */}
      <div className="text-center py-16">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          COUNTER-STRIKE 2
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto px-4">
          Contas Prime com skins valiosas e ranks elevados. Domine os mapas clássicos com estilo.
        </p>
      </div>

      {/* Status Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-gray-900 border border-blue-500 rounded-lg p-4 flex justify-between items-center">
          <span className="text-white">
            {products.length} contas encontradas para cs2
          </span>
          <button className="flex items-center space-x-2 text-blue-500 hover:text-blue-400 transition-colors">
            <RefreshCw className="w-4 h-4" />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Mensagem se não houver produtos */}
      {products.length === 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-16">
          <p className="text-gray-400 text-lg">Nenhuma conta CS2 disponível no momento.</p>
        </div>
      )}

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="max-w-md mx-auto">
       <div 
         onClick={() => {
           window.location.href = `/produto/${product.id}`;
         }}
         className="bg-gray-900 rounded-lg overflow-hidden shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer"
       >
          {/* Card Header */}
          <div className="relative">
            <img
              src={product.image_url || 'https://images.pexels.com/photos/1293269/pexels-photo-1293269.jpeg?auto=compress&cs=tinysrgb&w=400'}
              alt={product.name}
              className="w-full h-48 object-cover cursor-pointer"
              loading="eager"
              decoding="async"
              fetchpriority="high"
            />
            <div className="absolute top-4 left-4">
              <span className={`px-3 py-1 text-sm font-bold rounded ${getTagColor(product.tag_type)}`}>
                {product.tag}
              </span>
            </div>
          </div>

          <div className="p-6">
            {/* Product Name */}
            <h3 className="text-xl font-bold text-white mb-4">{product.name}</h3>

            {/* Features List */}
            <ul className="text-gray-300 space-y-2 mb-4">
              {(product.features || []).map((feature, index) => (
                <li key={index} className="flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                  {feature}
                </li>
              ))}
            </ul>

            {/* Price and Rating */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-6 h-6 text-green-400" />
                <span className="text-2xl font-bold text-white">R$ {Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-5 h-5 text-yellow-500 fill-current" />
                <span className="text-yellow-500 font-medium">{product.rating}</span>
              </div>
            </div>


            {/* Account ID */}
            <div className="text-center text-gray-400 text-sm">
              ID: {product.id} | Categoria: cs2
            </div>

            {/* Botão Ver Detalhes */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/produto/${product.id}`;
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer transform hover:scale-105 mt-4"
            >
              <Eye className="w-5 h-5" />
              <span>VER DETALHES</span>
            </button>

            {/* Botão Comprar Direto (se tiver checkout_url) */}
            {product.checkout_url && product.checkout_url.trim() !== '' && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(product.checkout_url, '_blank');
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer transform hover:scale-105 mt-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>COMPRAR AGORA</span>
              </button>
            )}
          </div>
        </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <Shield className="w-12 h-12 mx-auto mb-4 text-white" />
              <h3 className="text-xl font-bold text-white mb-2">100% Seguro</h3>
              <p className="text-gray-300">Transações protegidas e contas verificadas</p>
            </div>
            <div className="text-center">
              <User className="w-12 h-12 mx-auto mb-4 text-white" />
              <h3 className="text-xl font-bold text-white mb-2">Suporte 24/7</h3>
              <p className="text-gray-300">Atendimento especializado sempre disponível</p>
            </div>
            <div className="text-center">
              <Star className="w-12 h-12 mx-auto mb-4 text-white" />
              <h3 className="text-xl font-bold text-white mb-2">Qualidade Premium</h3>
              <p className="text-gray-300">Contas de alta qualidade com garantia</p>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2024 Traking.shop. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CS2Page;