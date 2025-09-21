import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, ShoppingCart, DollarSign, Eye } from 'lucide-react';
import { Zap, Flame, Trophy, Crown } from '../components/icons';
import { supabase } from '../lib/supabase';

const ProductSection: React.FC = () => {
  const [valorantSlide, setValorantSlide] = useState(0);
  const [cs2Slide, setCs2Slide] = useState(0);
  const [eafcSlide, setEafcSlide] = useState(0);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [productSkins, setProductSkins] = useState<Record<string, any[]>>({});
  const [valorantAutoSlide, setValorantAutoSlide] = useState(0);

  const valorantRef = useRef<HTMLDivElement>(null);
  const cs2Ref = useRef<HTMLDivElement>(null);
  const eafcRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  // Filtrar produtos por categoria
  const valorantProducts = products.filter(product => 
    (product.categories?.name?.toLowerCase() === 'valorant' ||
    product.name.toLowerCase().includes('valorant')) &&
    !product.name.toLowerCase().includes('counter-strike') &&
    !product.name.toLowerCase().includes('cs2') &&
    !product.name.toLowerCase().includes('csgo')
  );

  const cs2Products = products.filter(product => 
    product.categories?.name?.toLowerCase() === 'counter-strike' ||
    product.categories?.name?.toLowerCase() === 'cs2' ||
    product.categories?.name?.toLowerCase().includes('counter') ||
    product.name.toLowerCase().includes('cs2') ||
    product.name.toLowerCase().includes('counter-strike') ||
    product.name.toLowerCase().includes('counter strike') ||
    product.name.toLowerCase().includes('csgo') ||
    product.name.toLowerCase().includes('prime')
  );

  const eafcProducts = products.filter(product => 
    product.categories?.name?.toLowerCase() === 'ea sports fc' ||
    product.categories?.name?.toLowerCase() === 'fifa' ||
    product.name.toLowerCase().includes('ea sports fc') ||
    product.name.toLowerCase().includes('fifa') ||
    product.name.toLowerCase().includes('ea fc')
  );

  // Auto-slide para Valorant a cada 3 segundos
  useEffect(() => {
    if (valorantProducts.length > 3) {
      const interval = setInterval(() => {
        setValorantAutoSlide(prev => {
          const maxSlides = valorantProducts.length - 3;
          return prev >= maxSlides ? 0 : prev + 1;
        });
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [valorantProducts.length]);

  // Sincronizar scroll com auto-slide
  useEffect(() => {
    if (valorantRef.current && valorantProducts.length > 3) {
      const cardWidth = 400; // largura do card + gap
      const gap = 24; // gap entre cards (space-x-6 = 1.5rem = 24px)
      const scrollAmount = cardWidth; // 1 card por vez
      
      valorantRef.current.scrollTo({
        left: valorantAutoSlide * scrollAmount,
        behavior: 'smooth'
      });
    }
  }, [valorantAutoSlide, valorantProducts.length]);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Debug: Log dos produtos carregados
      console.log('🔍 Produtos carregados do banco:', data);
      if (data && data.length > 0) {
        console.log('📸 Primeira imagem de exemplo:', data[0].image_url);
        console.log('🏷️ Primeiro banner de exemplo:', {
          banner_title: data[0].banner_title,
          banner_subtitle: data[0].banner_subtitle,
          promotional_text: data[0].promotional_text
        });
      }
      
      setProducts(data || []);

      // Carregar skins implementadas para cada produto
      if (data && data.length > 0) {
        const skinsData: Record<string, any[]> = {};
        
        for (const product of data) {
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
            
            // Para produtos Valorant, selecionar 8 skins de armas diferentes
            const isValorant = product.categories?.name?.toLowerCase() === 'valorant' ||
                              product.name.toLowerCase().includes('valorant') ||
                              product.name.toLowerCase().includes('oferta relâmpago') ||
                              product.name.toLowerCase().includes('full acesso');
            
            if (isValorant && allSkins.length > 0) {
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
              // Para outros jogos, manter comportamento normal
              skinsData[product.id] = allSkins.slice(0, 6);
            }
          } else {
            skinsData[product.id] = [];
          }
        }
        
        setProductSkins(skinsData);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTagColor = (tagType: string) => {
    switch (tagType) {
      case 'exclusive':
        return 'bg-white text-black';
      case 'limited':
        return 'bg-red-600 text-white';
      case 'new':
        return 'bg-orange-500 text-white';
      case 'popular':
        return 'bg-purple-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getCardGradient = () => 'from-yellow-600/90 via-orange-600/90 to-yellow-800/90';

  const scrollCarousel = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = 320; // Width of one card + gap
      const newScrollLeft = direction === 'left' 
        ? ref.current.scrollLeft - scrollAmount
        : ref.current.scrollLeft + scrollAmount;
      
      ref.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const CategoryCarousel = ({ 
    title, 
    products, 
    carouselRef, 
    onScrollLeft, 
    onScrollRight 
  }: {
    title: string; 
    products: any[];
    carouselRef: React.RefObject<HTMLDivElement>;
    onScrollLeft: () => void;
    onScrollRight: () => void;
  }) => (
    <>
    {products.length === 0 ? (
      <div className="text-center py-8 text-gray-500">Nenhum produto encontrado</div>
    ) : (
    <div className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-3xl font-bold text-white">{title}</h3>
        <div className="flex items-center space-x-4">
          <button
            onClick={onScrollLeft}
            className="p-2 bg-gray-700 hover:bg-red-600 text-white rounded-full transition-colors duration-300"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={onScrollRight}
            className="p-2 bg-gray-700 hover:bg-red-600 text-white rounded-full transition-colors duration-300"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <span className="text-white text-sm">{products.length} contas disponíveis</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((product, index) => (
          <div
            key={product.id}
            onClick={() => { 
              // Navigate to product details page
              window.location.href = `/produto/${product.id}`;
            }}
            className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-700 flex flex-col h-[800px] cursor-pointer hover:border-gray-600 transition-all duration-300"
          >
            {/* Header com imagem, gradiente e conteúdo */}
            <div className="h-56 overflow-hidden flex-shrink-0">
              {/* Imagem de fundo */}
              <img
                src={product.image_url || 'https://images.pexels.com/photos/9072323/pexels-photo-9072323.jpeg?auto=compress&cs=tinysrgb&w=400'}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                loading="eager"
                decoding="async"
                fetchPriority="high"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.pexels.com/photos/9072323/pexels-photo-9072323.jpeg?auto=compress&cs=tinysrgb&w=400';
                }}
              />
            </div>

            {/* Conteúdo do card - usando flex para empurrar botão para baixo */}
            <div className="p-6 flex flex-col flex-1">
              <div>
                {/* Nome do produto com ícones */}
                <h4 className="text-white font-bold text-lg mb-4 leading-tight">
                  {product.name}
                </h4>

                {/* Features */}
                <ul className="text-gray-300 space-y-2 mb-6 text-sm max-h-32 overflow-y-auto">
                  {(product.features || []).map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-3 flex-shrink-0"></span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Skins preview */}
                <div className="mb-6">
                  <p className="text-white text-sm font-medium mb-2">
                    Skins ({productSkins[product.id]?.length || 0})
                  </p>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {(productSkins[product.id] || []).slice(0, 8).map((skin, i) => (
                      <div key={i} className="aspect-square bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-lg border-2 border-yellow-400 flex items-center justify-center p-1">
                        <img
                          src={skin.imagem_url}
                          alt={skin.nome_skin}
                          className="w-full h-full object-contain"
                          loading="eager"
                          decoding="async"
                          fetchPriority="high"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.pexels.com/photos/9072323/pexels-photo-9072323.jpeg?auto=compress&cs=tinysrgb&w=100';
                          }}
                        />
                      </div>
                    ))}
                    {/* Preencher slots vazios se tiver menos de 8 skins */}
                    {[...Array(Math.max(0, 8 - (productSkins[product.id]?.length || 0)))].map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square bg-gradient-to-br from-gray-500 to-gray-700 rounded-lg border-2 border-gray-400 flex items-center justify-center">
                        <div className="w-8 h-8 bg-black/30 rounded" title="Sem skin"></div>
                      </div>
                    ))}
                  </div>
                  <p className="text-yellow-400 text-xs font-medium text-center mb-4">
                    CLIQUE PARA VER TODAS
                  </p>
                </div>
              </div>

              {/* Spacer para empurrar conteúdo inferior */}
              <div className="flex-1"></div>

              {/* Área inferior fixa - preço, rating e botão */}
              <div className="mt-auto">
                {/* Preço e rating */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-6 h-6 text-green-400" />
                    <span className="text-2xl font-bold text-white">R$ {Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="text-yellow-400 font-bold">{product.rating}</span>
                  </div>
                </div>

                {/* Botão de compra fixo no rodapé */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    // Se tem checkout_url específico, usar ele
                    if (product.checkout_url && product.checkout_url.trim() !== '') {
                      window.open(product.checkout_url, '_blank');
                    } else {
                      // Senão, ir para página de detalhes
                      window.location.href = `/produto/${product.id}`;
                    }
                  }}
                  className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer transform hover:scale-105 ${
                    product.checkout_url && product.checkout_url.trim() !== '' 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {product.checkout_url && product.checkout_url.trim() !== '' ? (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      <span>COMPRAR AGORA</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-5 h-5" />
                      <span>VER DETALHES</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    )}
    </>
  );

  const ValorantCarousel = ({ 
    title, 
    products, 
    carouselRef, 
    onScrollLeft, 
    onScrollRight 
  }: {
    title: string; 
    products: any[];
    carouselRef: React.RefObject<HTMLDivElement>;
    onScrollLeft: () => void;
    onScrollRight: () => void;
  }) => (
    <>
    {products.length === 0 ? (
      <div className="text-center py-8 text-gray-500">Nenhum produto encontrado</div>
    ) : (
    <div className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-3xl font-bold text-white">{title}</h3>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              setValorantAutoSlide(prev => {
                const maxSlides = products.length - 3;
                return prev <= 0 ? maxSlides : prev - 1;
              });
            }}
            className="p-2 bg-gray-700 hover:bg-red-600 text-white rounded-full transition-colors duration-300"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setValorantAutoSlide(prev => {
                const maxSlides = products.length - 3;
                return prev >= maxSlides ? 0 : prev + 1;
              });
            }}
            className="p-2 bg-gray-700 hover:bg-red-600 text-white rounded-full transition-colors duration-300"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <span className="text-white text-sm">{products.length} contas disponíveis</span>
        </div>
      </div>

      {/* Container do carrossel */}
      <div className="overflow-hidden">
        <div 
          ref={carouselRef}
          className="flex space-x-6 transition-all duration-1000 ease-out transform-gpu"
          style={{ 
            transform: `translateX(-${valorantAutoSlide * 400}px)`,
            width: `${products.length * 400}px`
          }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              onClick={() => {
                window.location.href = `/produto/${product.id}`;
              }}
              className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-700 flex flex-col h-[800px] cursor-pointer hover:border-yellow-500 hover:shadow-yellow-500/20 transition-all duration-500 ease-out transform hover:scale-105 hover:-translate-y-2 flex-shrink-0 w-[376px] group"
            >
              {/* Header com imagem, gradiente e conteúdo */}
              <div className="h-56 overflow-hidden flex-shrink-0 relative">
                {/* Imagem de fundo */}
                <img
                  src={product.image_url || 'https://images.pexels.com/photos/9072323/pexels-photo-9072323.jpeg?auto=compress&cs=tinysrgb&w=400'}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  onError={(e) => {
                    console.error('❌ Erro ao carregar imagem:', product.image_url);
                    e.currentTarget.src = 'https://images.pexels.com/photos/9072323/pexels-photo-9072323.jpeg?auto=compress&cs=tinysrgb&w=400';
                  }}
                />
                {/* Overlay com gradiente animado */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>

              {/* Conteúdo do card - usando flex para empurrar botão para baixo */}
              <div className="p-6 flex flex-col flex-1">
                <div>
                  {/* Nome do produto com ícones */}
                  <h4 className="text-white font-bold text-lg mb-4 leading-tight group-hover:text-yellow-400 transition-colors duration-300">
                    {product.name}
                  </h4>

                  {/* Features */}
                  <ul className="text-gray-300 space-y-2 mb-6 text-sm max-h-32 overflow-y-auto">
                    {(product.features || []).map((feature, index) => (
                      <li key={index} className="flex items-center group-hover:text-gray-100 transition-colors duration-300">
                        <span className="w-2 h-2 bg-green-400 rounded-full mr-3 flex-shrink-0 group-hover:bg-yellow-400 transition-colors duration-300"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Skins preview */}
                  <div className="mb-6">
                    <p className="text-white text-sm font-medium mb-2 group-hover:text-yellow-400 transition-colors duration-300">
                      Skins ({productSkins[product.id]?.length || 0})
                    </p>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {(productSkins[product.id] || []).slice(0, 8).map((skin, i) => (
                        <div key={i} className="aspect-square bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-lg border-2 border-yellow-400 flex items-center justify-center p-1 transform transition-all duration-300 hover:scale-110 hover:rotate-3 hover:shadow-lg">
                          <img
                            src={skin.imagem_url}
                            alt={skin.nome_skin}
                            className="w-full h-full object-contain transition-transform duration-300"
                            loading="eager"
                            decoding="async"
                            fetchPriority="high"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.pexels.com/photos/9072323/pexels-photo-9072323.jpeg?auto=compress&cs=tinysrgb&w=100';
                            }}
                          />
                        </div>
                      ))}
                      {/* Preencher slots vazios se tiver menos de 8 skins */}
                      {[...Array(Math.max(0, 8 - (productSkins[product.id]?.length || 0)))].map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square bg-gradient-to-br from-gray-500 to-gray-700 rounded-lg border-2 border-gray-400 flex items-center justify-center transition-all duration-300 group-hover:border-gray-300">
                          <div className="w-8 h-8 bg-black/30 rounded" title="Sem skin"></div>
                        </div>
                      ))}
                    </div>
                    <p className="text-yellow-400 text-xs font-medium text-center mb-4 group-hover:text-yellow-300 transition-colors duration-300 animate-pulse group-hover:animate-none">
                      CLIQUE PARA VER TODAS
                    </p>
                  </div>
                </div>

                {/* Spacer para empurrar conteúdo inferior */}
                <div className="flex-1"></div>

                {/* Área inferior fixa - preço, rating e botão */}
                <div className="mt-auto">
                  {/* Preço e rating */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-6 h-6 text-green-400 group-hover:text-green-300 transition-colors duration-300" />
                      <span className="text-2xl font-bold text-white group-hover:text-green-300 transition-colors duration-300">R$ {Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-5 h-5 text-yellow-400 fill-current group-hover:text-yellow-300 transition-colors duration-300" />
                      <span className="text-yellow-400 font-bold group-hover:text-yellow-300 transition-colors duration-300">{product.rating}</span>
                    </div>
                  </div>

                  {/* Botão de compra fixo no rodapé */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      // Se tem checkout_url específico, usar ele
                      if (product.checkout_url && product.checkout_url.trim() !== '') {
                        window.open(product.checkout_url, '_blank');
                      } else {
                        // Senão, ir para página de detalhes
                        window.location.href = `/produto/${product.id}`;
                      }
                    }}
                    className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-500 flex items-center justify-center space-x-2 cursor-pointer transform hover:scale-105 hover:shadow-lg group-hover:animate-pulse ${
                      product.checkout_url && product.checkout_url.trim() !== '' 
                        ? 'bg-green-600 hover:bg-gradient-to-r hover:from-green-600 hover:to-emerald-600 text-white hover:shadow-green-500/30' 
                        : 'bg-blue-600 hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 text-white hover:shadow-blue-500/30'
                    }`}
                  >
                    {product.checkout_url && product.checkout_url.trim() !== '' ? (
                      <>
                        <ShoppingCart className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                        <span>COMPRAR AGORA</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                        <span>VER DETALHES</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Indicadores de slide */}
      {products.length > 3 && (
        <div className="flex justify-center space-x-2 mt-6">
          {Array.from({ length: Math.max(0, products.length - 2) }).map((_, index) => (
            <button
              key={index}
              onClick={() => setValorantAutoSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-500 transform hover:scale-125 ${
                valorantAutoSlide === index 
                  ? 'bg-gradient-to-r from-red-500 to-yellow-500 shadow-lg shadow-red-500/50 scale-125' 
                  : 'bg-gray-600 hover:bg-gray-500 hover:shadow-md'
              }`}
            />
          ))}
        </div>
      )}
    </div>
    )}
    </>
  );

  const CategoryCarouselStandard = ({ 
    title, 
    products, 
    carouselRef, 
    onScrollLeft, 
    onScrollRight 
  }: {
    title: string; 
    products: any[];
    carouselRef: React.RefObject<HTMLDivElement>;
    onScrollLeft: () => void;
    onScrollRight: () => void;
  }) => (
    <>
    {products.length === 0 ? (
      <div className="text-center py-8 text-gray-500">Nenhum produto encontrado</div>
    ) : (
    <div className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-3xl font-bold text-white">{title}</h3>
        <div className="flex items-center space-x-4">
          <button
            onClick={onScrollLeft}
            className="p-2 bg-gray-700 hover:bg-red-600 text-white rounded-full transition-colors duration-300"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={onScrollRight}
            className="p-2 bg-gray-700 hover:bg-red-600 text-white rounded-full transition-colors duration-300"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <span className="text-white text-sm">{products.length} contas disponíveis</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            onClick={() => {
              window.location.href = `/produto/${product.id}`;
            }}
            className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-700 flex flex-col h-[800px] cursor-pointer hover:border-gray-600 transition-all duration-300"
          >
            {/* Header com imagem, gradiente e conteúdo */}
            <div className="h-56 overflow-hidden flex-shrink-0">
              {/* Imagem de fundo */}
              <img
                src={product.image_url || 'https://images.pexels.com/photos/1293269/pexels-photo-1293269.jpeg?auto=compress&cs=tinysrgb&w=400'}
                alt={product.name}
              className="w-full h-full object-cover"
            loading="eager"
            decoding="async"
            fetchPriority="high"
                onError={(e) => {
                  e.currentTarget.src = title.includes('COUNTER-STRIKE') 
                    ? 'https://images.pexels.com/photos/1293269/pexels-photo-1293269.jpeg?auto=compress&cs=tinysrgb&w=400'
                    : 'https://images.pexels.com/photos/274422/pexels-photo-274422.jpeg?auto=compress&cs=tinysrgb&w=400';
                }}
              />
            </div>

            {/* Conteúdo do card - usando flex para empurrar botão para baixo */}
            <div className="p-6 flex flex-col flex-1">
              <div>
                {/* Nome do produto */}
                <h4 className="text-white font-bold text-lg mb-4 leading-tight">
                  {product.name}
                </h4>

                {/* Features */}
                <ul className="text-gray-300 space-y-2 mb-6 text-sm">
                  {(product.features || []).map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-3 flex-shrink-0"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Spacer para empurrar conteúdo inferior */}
              <div className="flex-1"></div>

              {/* Área inferior fixa - preço, rating e botão */}
              <div className="mt-auto">
                {/* Preço e rating */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-6 h-6 text-green-400" />
                    <span className="text-2xl font-bold text-white">R$ {Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="text-yellow-400 font-bold">{product.rating}</span>
                  </div>
                </div>

                {/* Botão de compra fixo no rodapé */}
                <button 
                  onClick={(e) => {
                    // Se tem checkout_url específico, usar ele
                    if (product.checkout_url && product.checkout_url.trim() !== '') {
                      window.open(product.checkout_url, '_blank');
                    } else {
                      // Senão, ir para página de detalhes
                      window.location.href = `/produto/${product.id}`;
                    }
                  }}
                  className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer transform hover:scale-105 ${
                    product.checkout_url && product.checkout_url.trim() !== '' 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {product.checkout_url && product.checkout_url.trim() !== '' ? (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      <span>COMPRAR AGORA</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-5 h-5" />
                      <span>VER DETALHES</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    )}
    </>
  );

  if (loading) {
    return (
      <section className="bg-black py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-white">Carregando produtos...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-black py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-white mb-12 text-center">CATÁLOGO DE PRODUTOS</h2>
        
        {/* Valorant Section - Só mostra se tiver produtos */}
        {valorantProducts.length > 0 && (
        <ValorantCarousel
          title="CONTAS VALORANT"
          products={valorantProducts}
          carouselRef={valorantRef}
          onScrollLeft={() => {}}
          onScrollRight={() => {}}
        />
        )}

        {/* Counter-Strike Section - Só mostra se tiver produtos */}
        {cs2Products.length > 0 && (
        <CategoryCarouselStandard
          title="CONTAS CS2 (COUNTER-STRIKE 2)"
          products={cs2Products}
          carouselRef={cs2Ref}
          onScrollLeft={() => scrollCarousel(cs2Ref, 'left')}
          onScrollRight={() => scrollCarousel(cs2Ref, 'right')}
        />
        )}

        {/* EA Sports FC Section - Só mostra se tiver produtos */}
        {eafcProducts.length > 0 && (
        <CategoryCarouselStandard
          title="EA SPORTS FC 26"
          products={eafcProducts}
          carouselRef={eafcRef}
          onScrollLeft={() => scrollCarousel(eafcRef, 'left')}
          onScrollRight={() => scrollCarousel(eafcRef, 'right')}
        />
        )}
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};

export default ProductSection;