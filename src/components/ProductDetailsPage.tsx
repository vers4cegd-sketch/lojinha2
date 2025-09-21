import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, ShoppingCart, Shield, Clock, Eye, CheckCircle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Zap, Flame, Crown, Trophy, Target, Gamepad2, X } from '../components/icons';
import { supabase } from '../lib/supabase';

const ProductDetailsPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [showAllSkins, setShowAllSkins] = useState(false);
  const [implementedSkins, setImplementedSkins] = useState<any[]>([]);
  const [loadingSkins, setLoadingSkins] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [timeLeft, setTimeLeft] = useState({
    hours: 21,
    minutes: 47,
    seconds: 42
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (productId) {
      loadProduct(productId);
    }
  }, [productId]);

  useEffect(() => {
    if (productId) {
      loadImplementedSkins(productId);
    }
  }, [productId]);

  const loadProduct = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao carregar produto:', error);
        return;
      }

      setProduct(data);
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadImplementedSkins = async (id: string) => {
    try {
      setLoadingSkins(true);
      const { data: accountSkins, error } = await supabase
        .from('account_skins')
        .select(`
          skins (
            id,
            nome_skin,
            imagem_url,
            raridade,
            arma
          )
        `)
        .eq('product_id', id);

      if (error) {
        console.error('Erro ao carregar skins implementadas:', error);
        return;
      }

      const skins = (accountSkins || []).map(item => item.skins);
      setImplementedSkins(skins);
    } catch (error) {
      console.error('Erro ao carregar skins implementadas:', error);
    } finally {
      setLoadingSkins(false);
    }
  };


  // Função para obter URL de checkout do produto
  const getCheckoutUrl = (product: any) => {
    // Usar checkout_url específico do produto se existir
    if (product?.checkout_url && product.checkout_url.trim() !== '') {
      return product.checkout_url;
    }
    
    // Fallback para URLs padrão baseadas na categoria
    const categoryName = product?.categories?.name?.toLowerCase();
    if (categoryName === 'valorant' || product?.name?.toLowerCase().includes('valorant')) {
      return 'https://checkout.traking.shop/valorant';
    } else if (categoryName === 'counter-strike' || categoryName === 'cs2' || product?.name?.toLowerCase().includes('cs2')) {
      return 'https://checkout.traking.shop/cs2';
    } else if (categoryName === 'ea sports fc' || categoryName === 'fifa' || product?.name?.toLowerCase().includes('ea sports fc')) {
      return 'https://checkout.traking.shop/ea-fc26';
    }
    return '#';
  };

  // Função para obter cor do gradiente baseada no jogo
  const getBannerGradient = (product: any) => {
    const categoryName = product?.categories?.name?.toLowerCase();
    if (categoryName === 'valorant' || product?.name?.toLowerCase().includes('valorant')) {
      return 'from-yellow-600/90 via-orange-600/90 to-yellow-800/90';
    } else if (categoryName === 'counter-strike' || categoryName === 'cs2' || product?.name?.toLowerCase().includes('cs2')) {
      return 'from-orange-600/90 via-yellow-600/90 to-orange-800/90';
    } else if (categoryName === 'ea sports fc' || categoryName === 'fifa' || product?.name?.toLowerCase().includes('ea sports fc')) {
      return 'from-blue-600/90 via-indigo-600/90 to-purple-600/90';
    }
    return 'from-gray-600/90 via-gray-700/90 to-gray-800/90';
  };

  // Função para obter página de volta baseada no produto
  const getBackPage = (product: any) => {
    const categoryName = product?.categories?.name?.toLowerCase();
    if (categoryName === 'valorant' || product?.name?.toLowerCase().includes('valorant')) {
      return '/valorant';
    } else if (categoryName === 'counter-strike' || categoryName === 'cs2' || product?.name?.toLowerCase().includes('cs2')) {
      return '/cs2';
    } else if (categoryName === 'ea sports fc' || categoryName === 'fifa' || product?.name?.toLowerCase().includes('ea sports fc')) {
      return '/ea-fc26';
    }
    return '/';
  };

  // Função para obter nome da categoria
  const getCategoryName = (product: any) => {
    const categoryName = product?.categories?.name?.toLowerCase();
    if (categoryName === 'valorant' || product?.name?.toLowerCase().includes('valorant')) {
      return 'VALORANT';
    } else if (categoryName === 'counter-strike' || categoryName === 'cs2' || product?.name?.toLowerCase().includes('cs2')) {
      return 'COUNTER-STRIKE 2';
    } else if (categoryName === 'ea sports fc' || categoryName === 'fifa' || product?.name?.toLowerCase().includes('ea sports fc')) {
      return 'EA SPORTS FC 26';
    }
    return 'PRODUTOS';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Exc':
        return 'bg-yellow-500 text-black';
      case 'Pro':
        return 'bg-blue-500 text-white';
      case 'Del':
        return 'bg-purple-500 text-white';
      case 'LIT':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'border-yellow-400 shadow-yellow-400/50';
      case 'epic':
        return 'border-purple-400 shadow-purple-400/50';
      case 'rare':
        return 'border-blue-400 shadow-blue-400/50';
      default:
        return 'border-gray-400 shadow-gray-400/50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Carregando produto...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Produto não encontrado</h1>
          <button 
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header com banner vermelho */}
      <div className="bg-red-600 text-white text-center py-2 font-bold text-sm">
        NOSSO DISCORD CAIU, CLIQUE AQUI E ENTRE NO NOVO
      </div>

      {/* Navigation */}
      <div className="bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-red-600">Traking</h1>
              <nav className="flex space-x-6">
                <a href="#" className="text-white hover:text-red-500 transition-colors">INÍCIO</a>
                <a href="#" className="text-white hover:text-red-500 transition-colors">DEPOIMENTOS</a>
                <a href="#" className="text-white hover:text-red-500 transition-colors">PERFIL</a>
              </nav>
            </div>
            <div className="text-white">
              LOGAR OU CADASTRAR
            </div>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <button 
          onClick={() => navigate(getBackPage(product))}
          className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>VOLTAR PARA {getCategoryName(product)}</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Product Image and Info */}
          <div className="space-y-6">
            {/* Product Banner */}
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={product.image_url || 'https://images.pexels.com/photos/9072323/pexels-photo-9072323.jpeg?auto=compress&cs=tinysrgb&w=600'}
                alt={product.name}
                className="w-full h-80 object-cover"
              />
            </div>

            {/* Product Title and Rating */}
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                <Zap className="inline w-6 h-6 text-yellow-400 mr-2" size={24} />
                {product.name || 'CONTA VALORANT PREMIUM'}
                <Zap className="inline w-6 h-6 text-yellow-400 ml-2" size={24} />
              </h1>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="text-yellow-400 font-bold">{product.rating || 4.9}</span>
                </div>
                <div className="flex items-center space-x-2 text-green-400">
                  <span className="text-2xl font-bold">R$ {Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Purchase Info */}
          <div className="space-y-6">
            {/* Countdown Timer */}
            {product.is_special_offer && (
              <div className="bg-red-900 border border-red-600 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2 text-red-400 mb-2">
                  <Clock className="w-5 h-5" />
                  <span className="font-bold">Restam apenas</span>
                </div>
                <div className="text-center text-red-300 font-bold text-2xl">
                  {String(timeLeft.hours).padStart(2, '0')}:
                  {String(timeLeft.minutes).padStart(2, '0')}:
                  {String(timeLeft.seconds).padStart(2, '0')}
                </div>
              </div>
            )}

            {/* Features */}
            <div className="bg-gray-900 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <h3 className="text-white font-bold">Conta Full Acesso</h3>
              </div>
              <ul className="space-y-2">
                {(product.features || []).map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-300">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Purchase Button */}
            <button 
              onClick={() => {
                window.open(getCheckoutUrl(product), '_blank');
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105 text-lg"
            >
              <ShoppingCart className="w-6 h-6" />
              <span>COMPRAR AGORA - R$ {Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </button>

            {/* Guarantee Info */}
            <div className="text-center text-gray-400 text-sm">
              <Shield className="w-4 h-4 inline mr-1" />
              Garantia de 30 dias • Suporte 24/7
            </div>
          </div>
        </div>

        {/* Skins Section - Only for Valorant */}
        {(product?.categories?.name?.toLowerCase() === 'valorant' || product?.name?.toLowerCase().includes('valorant')) && !loadingSkins && (
          <div className="mt-12">
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Star className="w-6 h-6 text-purple-400" />
                  <h2 className="text-2xl font-bold text-white">
                    Skins da Conta ({implementedSkins.length})
                  </h2>
                </div>
              </div>

              {implementedSkins.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Star className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-300 mb-2">Nenhuma skin implementada</h3>
                  <p className="text-gray-500">
                    As skins serão exibidas aqui quando forem implementadas no painel administrativo.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {(showAllSkins ? implementedSkins : implementedSkins.slice(0, 8)).map((skin, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 relative"
                      >
                        {/* Skin Image */}
                        <div className="aspect-[4/3] p-4 flex items-center justify-center bg-gradient-to-br from-yellow-400/20 to-yellow-600/20">
                          <img
                            src={skin.imagem_url}
                            alt={skin.nome_skin}
                            className="w-full h-full object-contain drop-shadow-lg"
                            loading="eager"
                            decoding="async"
                            fetchpriority="high"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.pexels.com/photos/9072323/pexels-photo-9072323.jpeg?auto=compress&cs=tinysrgb&w=300';
                            }}
                          />
                        </div>
                        
                        {/* Skin Name */}
                        <div className="p-4 text-center">
                          <h4 className="text-white font-bold text-sm leading-tight mb-1">
                            {skin.nome_skin}
                          </h4>
                          <p className="text-yellow-100 text-xs opacity-80">
                            {skin.arma}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Ver Todos Button - Centro */}
                  <div className="text-center mt-8">
                    {!showAllSkins && implementedSkins.length > 8 ? (
                      <button
                        onClick={() => setShowAllSkins(true)}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors font-medium flex items-center space-x-2 mx-auto"
                      >
                        <span>Ver Todos ({implementedSkins.length})</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    ) : showAllSkins && implementedSkins.length > 8 ? (
                      <button
                        onClick={() => setShowAllSkins(false)}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors font-medium flex items-center space-x-2 mx-auto"
                      >
                        <span>Ver Menos</span>
                        <svg className="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Loading Skins */}
        {(product?.categories?.name?.toLowerCase() === 'valorant' || product?.name?.toLowerCase().includes('valorant')) && loadingSkins && (
          <div className="mt-12">
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
                <span className="ml-4 text-white">Carregando skins...</span>
              </div>
            </div>
          </div>
        )}

        {/* Skins Section - Only for Valorant - OLD VERSION (REMOVE) */}
        {false && (
          <div className="mt-12">
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Star className="w-6 h-6 text-purple-400" />
                  <h2 className="text-2xl font-bold text-white">Skins da Conta ({product.detailedSkins.length})</h2>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[].map((skin, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 relative"
                  >
                    {/* Weapon Image */}
                    <div className="aspect-[4/3] p-4 flex items-center justify-center bg-gradient-to-br from-yellow-400/20 to-yellow-600/20">
                      <img
                        src={skin.image}
                        alt={skin.name}
                        className="w-full h-full object-contain drop-shadow-lg"
                      />
                    </div>
                    
                    {/* Skin Name */}
                    <div className="p-4 text-center">
                      <h4 className="text-white font-bold text-sm leading-tight">
                        {skin.name}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>

              {/* Ver Todos Button - Centro */}
              <div className="text-center mt-8">
                {false ? (
                  <button
                    onClick={() => setShowAllSkins(true)}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors font-medium flex items-center space-x-2 mx-auto"
                  >
                    <span>Ver Todos</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                ) : false ? (
                  <button
                    onClick={() => setShowAllSkins(false)}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors font-medium flex items-center space-x-2 mx-auto"
                  >
                    <span>Ver Menos</span>
                    <svg className="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailsPage;