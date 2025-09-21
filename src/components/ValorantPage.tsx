import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Shield, User, Star, Clock, ChevronLeft, ChevronRight, ArrowLeft, Eye, DollarSign } from 'lucide-react';
import { Zap, Flame, Gem, Trophy, Gift } from '../components/icons';
import { supabase } from '../lib/supabase';

interface Product {
  id: string;
  name: string;
  price: string;
  rating: number;
  image: string;
  tag: string;
  tagType: 'exclusive' | 'limited' | 'new' | 'popular';
  features: string[];
  skinsCount: number;
  skins: Array<{
    name: string;
    type: 'Exc' | 'Pro' | 'Del' | 'LIT';
  }>;
  isSpecialOffer?: boolean;
  timeLeft?: {
    hours: number;
    minutes: number;
    seconds: number;
  };
}

interface ValorantPageProps {
  onBack: () => void;
}

const ValorantPage: React.FC<ValorantPageProps> = ({ onBack }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productSkins, setProductSkins] = useState<Record<string, any[]>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  
  const [timeLeft, setTimeLeft] = useState({
    hours: 21,
    minutes: 47,
    seconds: 42
  });

  useEffect(() => {
    loadValorantProducts();
  }, []);

  const loadValorantProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filtrar apenas produtos de Valorant
      const valorantProducts = (data || []).filter(product => 
        (product.categories?.name?.toLowerCase() === 'valorant' ||
        product.name.toLowerCase().includes('valorant') ||
        product.name.toLowerCase().includes('oferta relâmpago') ||
        product.name.toLowerCase().includes('full acesso')) &&
        // Excluir produtos de Counter-Strike/CS2
        !product.categories?.name?.toLowerCase().includes('counter') &&
        !product.categories?.name?.toLowerCase().includes('cs2') &&
        !product.name.toLowerCase().includes('counter-strike') &&
        !product.name.toLowerCase().includes('counter strike') &&
        !product.name.toLowerCase().includes('cs2') &&
        !product.name.toLowerCase().includes('csgo') &&
        !product.name.toLowerCase().includes('prime')
      );
      
      setProducts(valorantProducts);

      // Carregar skins implementadas para cada produto Valorant
      if (valorantProducts.length > 0) {
        const skinsData: Record<string, any[]> = {};
        
        for (const product of valorantProducts) {
          const { data: accountSkins, error: skinsError } = await supabase
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
            .eq('product_id', product.id)
            .limit(50); // Pegar mais skins para poder filtrar por arma

          if (!skinsError && accountSkins) {
            const allSkins = accountSkins.map(item => item.skins);
            
            // Selecionar 8 skins de armas diferentes
            if (allSkins.length > 0) {
              // Agrupar skins por arma
              const skinsByWeapon = allSkins.reduce((acc, skin) => {
                if (!acc[skin.arma]) {
                  acc[skin.arma] = [];
                }
                acc[skin.arma].push(skin);
                return acc;
              }, {} as Record<string, any[]>);
              
              // Selecionar 1 skin de cada arma (máximo 8)
              const selectedSkins: any[] = [];
              const weapons = Object.keys(skinsByWeapon);
              
              for (let i = 0; i < Math.min(8, weapons.length); i++) {
                const weapon = weapons[i];
                const randomSkin = skinsByWeapon[weapon][Math.floor(Math.random() * skinsByWeapon[weapon].length)];
                selectedSkins.push(randomSkin);
              }
              
              // Se tiver menos de 8 armas, pegar skins aleatórias das armas restantes
              if (selectedSkins.length < 8 && allSkins.length >= 8) {
                const usedSkinIds = new Set(selectedSkins.map(s => s.id));
                const remainingSkins = allSkins.filter(s => !usedSkinIds.has(s.id));
                
                while (selectedSkins.length < 8 && remainingSkins.length > 0) {
                  const randomIndex = Math.floor(Math.random() * remainingSkins.length);
                  selectedSkins.push(remainingSkins.splice(randomIndex, 1)[0]);
                }
              }
              
              skinsData[product.id] = selectedSkins;
            } else {
              skinsData[product.id] = [];
            }
          } else {
            skinsData[product.id] = [];
          }
        }
        
        setProductSkins(skinsData);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos Valorant:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const itemsPerPage = 3;
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const showCarousel = products.length > itemsPerPage;

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      setCurrentPage(0); // Rolagem infinita
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    } else {
      setCurrentPage(totalPages - 1); // Rolagem infinita
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const getCurrentProducts = () => {
    if (!showCarousel) return products;
    const startIndex = currentPage * itemsPerPage;
    return products.slice(startIndex, startIndex + itemsPerPage);
  };

  const getTagColor = (tagType: string) => {
    switch (tagType) {
      case 'exclusive':
        return 'bg-white text-black';
      case 'limited':
        return 'bg-red-600 text-white';
      case 'new':
        return 'bg-yellow-500 text-black';
      case 'popular':
        return 'bg-purple-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getSkinTypeColor = (type: string) => {
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

  const getCardBorderColor = (tagType: string) => {
    switch (tagType) {
      case 'exclusive':
        return 'border-yellow-500';
      case 'limited':
        return 'border-red-500';
      default:
        return 'border-transparent';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Carregando produtos Valorant...</p>
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
          VALORANT
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto px-4">
          Contas premium com as melhores skins e ranks elevados. Qualidade garantida e entrega imediata.
        </p>
      </div>

      {/* Status Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-gray-900 border border-blue-500 rounded-lg p-4 flex justify-between items-center">
          <span className="text-white">
            {products.length} contas encontradas para valorant
          </span>
          <button className="flex items-center space-x-2 text-blue-500 hover:text-blue-400 transition-colors">
            <RefreshCw className="w-4 h-4" />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Carousel Controls */}
      {showCarousel && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={prevPage}
                className="p-2 bg-gray-700 hover:bg-red-600 text-white rounded-full transition-colors duration-300"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextPage}
                className="p-2 bg-gray-700 hover:bg-red-600 text-white rounded-full transition-colors duration-300"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            <div className="text-center flex-1">
              <span className="text-white text-sm">{products.length} contas disponíveis</span>
            </div>
          </div>
        </div>
      )}

      {/* Mensagem se não houver produtos */}
      {products.length === 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-16">
          <p className="text-gray-400 text-lg">Nenhuma conta Valorant disponível no momento.</p>
        </div>
      )}

      {/* Products Grid - Infinite Vertical Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div 
          ref={carouselRef}
          className={`grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {products.map((product) => (
            <div
              key={product.id}
              onClick={() => {
                window.location.href = `/produto/${product.id}`;
              }}
              className={`bg-gray-900 rounded-lg overflow-hidden shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl select-none border-2 ${getCardBorderColor(product.tag_type)} flex flex-col h-[800px]`}
            >
              {/* Special Offer Banner */}
              {product.is_special_offer && (
                <div className="bg-red-600 text-white text-center py-2 font-bold">

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
                  OFERTA LIMITADA
                </div>
              )}

              {/* Card Header */}
              <div className="flex-shrink-0 h-48">
                <img
                  src={product.image_url || 'https://images.pexels.com/photos/9072323/pexels-photo-9072323.jpeg?auto=compress&cs=tinysrgb&w=400'}
                  alt={product.name}
                  className="w-full h-48 object-cover cursor-pointer"
                  loading="eager"
                  decoding="async"
                  fetchpriority="high"
                />
              </div>

              <div className="p-6 flex flex-col flex-1 cursor-pointer">
                <div className="flex-1 min-h-0">
                  {/* Product Name */}
                  <h3 className="text-lg font-bold text-white mb-3 line-clamp-2 min-h-[3.5rem] leading-tight">{product.name}</h3>

                  {/* Countdown Timer for Special Offers */}
                  {product.is_special_offer && product.time_left && (
                    <div className="mb-3 p-2 bg-red-900 rounded-lg">
                      <div className="flex items-center justify-center space-x-2 text-red-400 mb-2">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">Restam apenas</span>
                      </div>
                      <div className="text-center text-red-300 font-bold text-sm">
                        {String(timeLeft.hours).padStart(2, '0')}:
                        {String(timeLeft.minutes).padStart(2, '0')}:
                        {String(timeLeft.seconds).padStart(2, '0')}
                      </div>
                    </div>
                  )}

                  {/* Features List */}
                  <ul className="text-gray-300 space-y-1 mb-3 text-sm max-h-24 overflow-y-auto">
                    {(product.features || []).map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Skins Preview */}
                  <div className="mb-3">
                    <h4 className="text-white text-sm mb-2">
                      Skins Preview ({productSkins[product.id]?.length || 0})
                    </h4>
                    <div className="grid grid-cols-4 gap-1 mb-2">
                      {(productSkins[product.id] || []).slice(0, 8).map((skin, index) => (
                        <div key={index} className="relative group">
                          <div className="w-full h-12 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded border border-yellow-400 flex items-center justify-center p-1 overflow-hidden">
                            <img
                              src={skin.imagem_url}
                              alt={skin.nome_skin}
                              className="w-full h-full object-contain"
                              loading="eager"
                              decoding="async"
                              fetchpriority="high"
                              onError={(e) => {
                                e.currentTarget.src = 'https://images.pexels.com/photos/9072323/pexels-photo-9072323.jpeg?auto=compress&cs=tinysrgb&w=100';
                              }}
                            />
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded flex items-end justify-center pb-1">
                            <span className="text-xs text-white font-bold bg-black/50 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity truncate max-w-full">
                              {skin.arma}
                            </span>
                          </div>
                        </div>
                      ))}
                      {/* Preencher slots vazios se tiver menos de 8 skins */}
                      {[...Array(Math.max(0, 8 - (productSkins[product.id]?.length || 0)))].map((_, i) => (
                        <div key={`empty-${i}`} className="w-full h-12 bg-gradient-to-br from-gray-500 to-gray-700 rounded border border-gray-400 flex items-center justify-center">
                          <div className="w-6 h-6 bg-black/30 rounded" title="Sem skin"></div>
                        </div>
                      ))}
                    </div>
                    <p className="text-yellow-500 text-xs text-center">
                      CLIQUE PARA VER TODAS
                    </p>
                  </div>
                </div>

                {/* Área inferior fixa - preço, rating e botão */}
                <div className="mt-auto pt-3 border-t border-gray-700">
                  {/* Price and Rating */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-400">
                        {product.banner_title?.split(' ')[0] || product.name?.split(' ')[0] || 'CONTA'}
                      </span>
                      <DollarSign className="w-6 h-6 text-green-400" />
                      <span className="text-xl font-bold text-white">R$ {Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      <span className="text-yellow-500 font-medium">{product.rating}</span>
                    </div>
                  </div>

                  {/* Promotional Text */}
                  <div className="text-center mb-3">
                    <div className="text-white font-bold text-sm">
                      {product.promotional_text || 'FULL ACESSO'}
                    </div>
                    <div className="text-white/90 text-xs font-medium">
                      {product.delivery_info || 'ENTREGA AUTOMÁTICA'}
                    </div>
                  </div>

                  {/* Account ID */}
                  <div className="text-center text-gray-400 text-xs">
                    ID: {product.id} | Categoria: valorant
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Pagination Dots */}
        {showCarousel && (
          <div className="flex justify-center space-x-2 mt-8">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  currentPage === index ? 'bg-red-600' : 'bg-gray-600 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>
        )}
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

export default ValorantPage;