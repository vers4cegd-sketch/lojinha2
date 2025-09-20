import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Eye, DollarSign, Star, ArrowUp, ArrowDown, GripVertical, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import BannerLibrary from './BannerLibrary';

interface Product {
  id: string;
  name: string;
  price: number;
  rating: number;
  image_url: string;
  checkout_url: string;
  tag: string;
  tag_type: string;
  features: string[];
  skins_count: number;
  skins: any[];
  is_special_offer: boolean;
  time_left: any;
  category_id: string;
  show_skins_preview: boolean;
  created_at: string;
  updated_at: string;
  order_index: number;
  categories?: {
    name: string;
  };
}

const ProductsManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    rating: 4.5,
    image_url: '',
    checkout_url: '',
    tag: '',
    tag_type: 'popular',
    features: [''],
    category_id: '',
    is_special_offer: false,
    show_skins_preview: true,
    order_index: 0
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [showBannerLibrary, setShowBannerLibrary] = useState(false);
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      console.log('🔄 Carregando produtos do admin...');
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao carregar produtos:', error);
        throw error;
      }
      
      console.log('✅ Produtos carregados:', data?.length || 0);
      console.log('📊 Primeiros 3 produtos:', data?.slice(0, 3).map(p => ({ id: p.id, name: p.name })));
      
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      // Em caso de erro, tentar carregar sem ordenação
      try {
        console.log('🔄 Tentando carregar produtos sem ordenação...');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('products')
          .select(`
            *,
            categories (name)
          `);
        
        if (!fallbackError && fallbackData) {
          console.log('✅ Produtos carregados (fallback):', fallbackData.length);
          setProducts(fallbackData);
        }
      } catch (fallbackError) {
        console.error('❌ Erro no fallback:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Se há arquivo para upload, fazer upload primeiro
      if (imageFile) {
        await handleImageUpload(imageFile);
        // Aguardar um pouco para garantir que a URL foi atualizada
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const productData = {
        name: formData.name,
        price: formData.price,
        rating: formData.rating,
        image_url: formData.image_url,
        checkout_url: formData.checkout_url,
        tag: formData.tag,
        tag_type: formData.tag_type,
        features: formData.features.filter(f => f.trim() !== ''),
        category_id: formData.category_id || null,
        is_special_offer: formData.is_special_offer,
        show_skins_preview: formData.show_skins_preview,
        order_index: formData.order_index,
        updated_at: new Date().toISOString()
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert([{
            ...productData,
            order_index: products.length
          }]);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Erro ao salvar produto');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      rating: product.rating,
      image_url: product.image_url || '',
      checkout_url: product.checkout_url || '',
      tag: product.tag || '',
      tag_type: product.tag_type || 'popular',
      features: product.features && product.features.length > 0 ? product.features : [''],
      category_id: product.category_id || '',
      is_special_offer: product.is_special_offer || false,
      show_skins_preview: product.show_skins_preview !== undefined ? product.show_skins_preview : true,
      order_index: product.order_index || 0
    });
    setImagePreview(product.image_url || '');
    setImageFile(null);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Erro ao excluir produto');
    }
  };

  const moveProduct = async (productId: string, direction: 'up' | 'down') => {
    try {
      // Primeiro, garantir que todos os produtos tenham order_index
      const { error: updateError } = await supabase
        .from('products')
        .update({ order_index: 0 })
        .is('order_index', null);
      
      if (updateError) {
        console.warn('⚠️ Aviso ao atualizar order_index nulos:', updateError);
      }
      
      // Recarregar produtos para ter dados atualizados
      loadProducts();
    } catch (error) {
      console.error('Error reordering products:', error);
      alert('Funcionalidade de ordenação será implementada após a migração do banco');
    }
  };

  const resetProductOrder = async () => {
    try {
      // Garantir que todos os produtos tenham order_index = 0
      const { error } = await supabase
        .from('products')
        .update({ order_index: 0 });
      
      if (error) {
        console.warn('⚠️ Aviso ao resetar order_index:', error);
      }
      
      loadProducts();
    } catch (error) {
      console.error('Error resetting product order:', error);
      console.log('ℹ️ Funcionalidade de ordenação será implementada após migração');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: 0,
      rating: 4.5,
      image_url: '',
      checkout_url: '',
      tag: '',
      tag_type: 'popular',
      features: [''],
      category_id: '',
      is_special_offer: false,
      show_skins_preview: true,
      order_index: 0
    });
    setImageFile(null);
    setImagePreview('');
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      console.log('🔄 Iniciando upload da imagem...');
      console.log('📁 Arquivo:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      // Primeiro, verificar se o bucket existe
      console.log('🔍 Verificando se bucket product-images existe...');
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('❌ Erro ao listar buckets:', listError);
      } else {
        console.log('📦 Buckets existentes:', buckets?.map(b => b.name));
      }

      const bucketExists = buckets?.some(bucket => bucket.name === 'product-images');
      
      if (!bucketExists) {
        console.log('🔧 Bucket não existe, criando...');
        
        // Bucket deve ser criado via migração SQL
        console.error('❌ Bucket product-images não existe. Execute a migração SQL primeiro.');
        throw new Error('Bucket product-images não encontrado. Execute a migração SQL para criar o bucket com as políticas RLS corretas.');
      } else {
        console.log('✅ Bucket product-images já existe');
      }

      // Criar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `product-${Date.now()}.${fileExt}`;
      console.log('📝 Nome do arquivo:', fileName);
      
      // Upload para Supabase Storage
      console.log('⬆️ Fazendo upload...');
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        });

      if (error) {
        console.error('❌ Erro detalhado no upload:', {
          error,
          message: error.message,
          statusCode: error.statusCode,
          details: error
        });
        throw error;
      }

      console.log('✅ Upload realizado:', data);

      // Obter URL pública
      console.log('🔗 Obtendo URL pública...');
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      console.log('🌐 URL pública gerada:', publicUrl);

      // Atualizar formulário com nova URL
      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      setImagePreview(publicUrl);
      
      // Mostrar sucesso
      alert('✅ Upload realizado com sucesso!');
      console.log('🎉 Upload concluído com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro completo no upload:', error);
      
      let errorMessage = 'Erro desconhecido no upload';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      }
      
      alert(`❌ Erro no upload: ${errorMessage}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('📁 Arquivo selecionado:', {
        name: file.name,
        type: file.type,
        size: file.size,
        sizeInMB: (file.size / 1024 / 1024).toFixed(2) + 'MB'
      });

      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        console.error('❌ Tipo de arquivo inválido:', file.type);
        alert('Por favor, selecione apenas arquivos de imagem.');
        return;
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        console.error('❌ Arquivo muito grande:', file.size);
        alert('Arquivo muito grande. Máximo 5MB.');
        return;
      }

      console.log('✅ Arquivo válido, criando preview...');
      setImageFile(file);
      
      // Criar preview local
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log('🖼️ Preview criado');
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }));
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Produtos</h1>
          <p className="text-gray-600 mt-1">Adicione, edite ou remova produtos da loja</p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            resetForm();
            setShowModal(true);
          }}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Produto</span>
        </button>
      </div>

      {/* Order Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Ordem dos Produtos</h3>
            <p className="text-sm text-gray-600">Use os botões para reorganizar a ordem de exibição</p>
          </div>
          <button
            onClick={resetProductOrder}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Resetar Ordem
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none transition-all duration-200"
          >
            <option value="">Todas as categorias</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products List */}
      <div className="space-y-4">
        {filteredProducts.map((product, index) => (
          <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="flex">
              {/* Order Controls */}
              <div className="flex flex-col justify-center p-4 border-r border-gray-200 bg-gray-50">
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => moveProduct(product.id, 'up')}
                    disabled={index === 0}
                    className="p-1 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                    title="Mover para cima"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <GripVertical className="w-4 h-4 text-gray-400 mx-auto" />
                  <button
                    onClick={() => moveProduct(product.id, 'down')}
                    disabled={index === filteredProducts.length - 1}
                    className="p-1 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                    title="Mover para baixo"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-gray-500 text-center mt-2">
                  #{product.order_index}
                </div>
              </div>

              {/* Product Image */}
              <div className="w-32 h-24 flex-shrink-0">
                <img
                  src={product.image_url || 'https://images.pexels.com/photos/9072323/pexels-photo-9072323.jpeg?auto=compress&cs=tinysrgb&w=400'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  loading="eager"
                  decoding="async"
                  fetchpriority="high"
                />
              </div>

              {/* Product Info */}
              <div className="flex-1 p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Categoria: {product.categories?.name || 'Sem categoria'}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span>R$ {Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>{product.rating}</span>
                      </div>
                      {product.is_special_offer && (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                          Oferta Especial
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => window.open(product.image_url, '_blank')}
                      className="text-blue-600 hover:text-blue-900 transition-colors p-1 hover:bg-blue-50 rounded"
                      title="Ver imagem"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-blue-600 hover:text-blue-900 transition-colors p-1 hover:bg-blue-50 rounded"
                      title="Editar produto"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-900 transition-colors p-1 hover:bg-red-50 rounded"
                      title="Excluir produto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Features Preview */}
                {product.features && product.features.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Features:</p>
                    <div className="flex flex-wrap gap-1">
                      {product.features.slice(0, 3).map((feature, i) => (
                        <span key={i} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                          {feature.length > 30 ? feature.substring(0, 30) + '...' : feature}
                        </span>
                      ))}
                      {product.features.length > 3 && (
                        <span className="text-gray-500 text-xs">+{product.features.length - 3} mais</span>
                      )}
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-2">
                  Criado em: {new Date(product.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl my-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Produto
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Ex: Conta Valorant Premium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Avaliação (1-5)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData(prev => ({ ...prev, rating: parseFloat(e.target.value) || 4.5 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tag
                  </label>
                  <input
                    type="text"
                    value={formData.tag}
                    onChange={(e) => setFormData(prev => ({ ...prev, tag: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Ex: EXCLUSIVO"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo da Tag
                  </label>
                  <select
                    value={formData.tag_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, tag_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="popular">Popular</option>
                    <option value="exclusive">Exclusivo</option>
                    <option value="limited">Limitado</option>
                    <option value="new">Novo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ordem de Exibição
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.order_index}
                    onChange={(e) => setFormData(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="special_offer"
                    checked={formData.is_special_offer}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_special_offer: e.target.checked }))}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <label htmlFor="special_offer" className="ml-2 text-sm text-gray-700">
                    Oferta Especial
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="show_skins_preview"
                    checked={formData.show_skins_preview}
                    onChange={(e) => setFormData(prev => ({ ...prev, show_skins_preview: e.target.checked }))}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <label htmlFor="show_skins_preview" className="ml-2 text-sm text-gray-700">
                    Mostrar Preview de Skins
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Imagem do Produto
                </label>
                
                {/* Preview da Imagem */}
                {imagePreview && (
                  <div className="mb-3">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-24 object-cover rounded-lg border border-gray-300"
                    />
                  </div>
                )}
                
                {/* Upload de Arquivo */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      📁 Upload de Imagem (Recomendado)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      disabled={uploadingImage}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-red-50 file:text-red-600 hover:file:bg-red-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Formatos: JPG, PNG, WebP | Máximo: 5MB
                    </p>
                  </div>
                  
                  {/* Botão de Upload */}
                  {imageFile && (
                    <button
                      type="button"
                      onClick={() => imageFile && handleImageUpload(imageFile)}
                      disabled={uploadingImage}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      {uploadingImage ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Enviando Imagem...</span>
                        </>
                      ) : (
                        <>
                          <span>📤 Enviar Imagem</span>
                        </>
                      )}
                    </button>
                  )}
                  
                  <div className="text-center text-xs text-gray-500">
                    OU
                  </div>
                  
                  {/* Biblioteca de Banners */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowBannerLibrary(true)}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>📚 Biblioteca de Banners</span>
                    </button>
                  </div>
                  
                  <div className="text-center text-xs text-gray-500">
                    OU
                  </div>
                  
                  {/* URL Manual */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      🔗 URL da Imagem (Alternativo)
                    </label>
                    <input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, image_url: e.target.value }));
                        setImagePreview(e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="https://exemplo.com/imagem.jpg"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL de Checkout
                </label>
                <input
                  type="url"
                  value={formData.checkout_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, checkout_url: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="https://checkout.exemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Features do Produto
                </label>
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Ex: Conta Full Acesso/BR"
                    />
                    {formData.features.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addFeature}
                  className="mt-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Feature</span>
                </button>
              </div>
            </form>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                {editingProduct ? 'Atualizar' : 'Criar'} Produto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal da Biblioteca de Banners */}
      {showBannerLibrary && (
        <BannerLibrary
          isModal={true}
          onSelectBanner={(banner) => {
            setFormData(prev => ({ ...prev, image_url: banner.image_url }));
            setImagePreview(banner.image_url);
            setShowBannerLibrary(false);
            alert(`✅ Banner "${banner.name}" selecionado!`);
          }}
          onClose={() => setShowBannerLibrary(false)}
        />
      )}
    </div>
  );
};

export default ProductsManager;