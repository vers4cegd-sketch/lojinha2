import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import BannerLibrary from './BannerLibrary';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  order_index: number;
  created_at: string;
}

const CategoriesManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showBannerLibrary, setShowBannerLibrary] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    order_index: 0
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const categoryData = {
        name: formData.name,
        slug: formData.slug || generateSlug(formData.name),
        description: formData.description,
        image_url: formData.image_url,
        order_index: formData.order_index,
        updated_at: new Date().toISOString()
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingCategory.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([{
            ...categoryData,
            order_index: categories.length
          }]);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingCategory(null);
      resetForm();
      loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Erro ao salvar categoria');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image_url: category.image_url || '',
      order_index: category.order_index || 0
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria? Todos os produtos desta categoria também serão removidos.')) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Erro ao excluir categoria');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      image_url: '',
      order_index: 0
    });
  };

  const moveCategory = async (categoryId: string, direction: 'up' | 'down') => {
    const currentIndex = categories.findIndex(cat => cat.id === categoryId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;

    try {
      // Swap order_index values
      const currentCategory = categories[currentIndex];
      const targetCategory = categories[newIndex];

      await supabase
        .from('categories')
        .update({ order_index: targetCategory.order_index })
        .eq('id', currentCategory.id);

      await supabase
        .from('categories')
        .update({ order_index: currentCategory.order_index })
        .eq('id', targetCategory.id);

      loadCategories();
    } catch (error) {
      console.error('Error reordering categories:', error);
      alert('Erro ao reordenar categorias');
    }
  };

  const resetCategoryOrder = async () => {
    if (!confirm('Tem certeza que deseja resetar a ordem das categorias?')) return;

    try {
      for (let i = 0; i < categories.length; i++) {
        await supabase
          .from('categories')
          .update({ order_index: i })
          .eq('id', categories[i].id);
      }
      loadCategories();
    } catch (error) {
      console.error('Error resetting category order:', error);
      alert('Erro ao resetar ordem das categorias');
    }
  };

  // Predefined category images for consistency
  const predefinedCategories = [
    {
      name: 'Counter-Strike 2',
      slug: 'counter-strike',
      description: 'Contas Prime com skins valiosas e ranks elevados',
      image_url: '/4R5byRa.png',
      order_index: 0
    },
    {
      name: 'Valorant',
      slug: 'valorant',
      description: 'Contas premium com as melhores skins e ranks elevados',
      image_url: '/apps.21507.13663857844271189.4c1de202-3961-4c40-a0aa-7f4f1388775a (1).png',
      order_index: 1
    },
    {
      name: 'EA Sports FC',
      slug: 'ea-sports-fc',
      description: 'Contas com jogadores exclusivos e times completos',
      image_url: '/022239a9673a747fed6f50be0e0da132.jpg',
      order_index: 2
    }
  ];

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Categorias</h1>
          <p className="text-gray-600 mt-1">Adicione, edite ou remova categorias de jogos</p>
        </div>
        <button
          onClick={() => {
            setEditingCategory(null);
            resetForm();
            setShowModal(true);
          }}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>Nova Categoria</span>
        </button>
      </div>

      {/* Order Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Ordem das Categorias</h3>
            <p className="text-sm text-gray-600">Use os botões para reorganizar a ordem de exibição</p>
          </div>
          <button
            onClick={resetCategoryOrder}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Resetar Ordem
          </button>
        </div>
      </div>
      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar categorias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="space-y-4">
        {filteredCategories.map((category) => (
          <div key={category.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="flex">
              {/* Order Controls */}
              <div className="flex flex-col justify-center p-4 border-r border-gray-200 bg-gray-50">
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => moveCategory(category.id, 'up')}
                    disabled={categories.findIndex(cat => cat.id === category.id) === 0}
                    className="p-1 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                    title="Mover para cima"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <GripVertical className="w-4 h-4 text-gray-400 mx-auto" />
                  <button
                    onClick={() => moveCategory(category.id, 'down')}
                    disabled={categories.findIndex(cat => cat.id === category.id) === categories.length - 1}
                    className="p-1 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                    title="Mover para baixo"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-gray-500 text-center mt-2">
                  #{category.order_index + 1}
                </div>
              </div>

              {/* Category Image */}
              <div className="w-32 h-24 flex-shrink-0">
                <img
                  src={category.image_url || 'https://images.pexels.com/photos/9072323/pexels-photo-9072323.jpeg?auto=compress&cs=tinysrgb&w=400'}
                  alt={category.name}
                  className="w-full h-full object-cover"
                  loading="eager"
                  decoding="async"
                  fetchpriority="high"
                />
              </div>

              {/* Category Info */}
              <div className="flex-1 p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="text-blue-600 hover:text-blue-900 transition-colors p-1 hover:bg-blue-50 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="text-red-600 hover:text-red-900 transition-colors p-1 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">Slug: {category.slug}</p>
                <p className="text-gray-700 text-sm mb-2">{category.description}</p>
                <p className="text-xs text-gray-500">
                  Criado em: {new Date(category.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Old Grid Layout - Remove this section */}
      <div className="hidden grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category) => (
          <div key={category.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="aspect-video overflow-hidden">
              <img
                src={category.image_url || 'https://images.pexels.com/photos/9072323/pexels-photo-9072323.jpeg?auto=compress&cs=tinysrgb&w=400'}
                alt={category.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="text-blue-600 hover:text-blue-900 transition-colors p-1 hover:bg-blue-50 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="text-red-600 hover:text-red-900 transition-colors p-1 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">Slug: {category.slug}</p>
              <p className="text-gray-700 text-sm">{category.description}</p>
              <p className="text-xs text-gray-500 mt-4">
                Criado em: {new Date(category.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Categoria
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData(prev => ({ 
                      ...prev, 
                      name,
                      slug: prev.slug || generateSlug(name)
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Ex: Valorant"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug (URL)
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Ex: valorant"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Usado na URL: /categoria/{formData.slug}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Descrição da categoria..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL da Imagem
                </label>
                <div className="mb-2">
                  <p className="text-xs text-gray-500 mb-2">Categorias pré-definidas:</p>
                  <div className="flex flex-wrap gap-2">
                    {predefinedCategories.map((cat, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          name: cat.name,
                          slug: cat.slug,
                          description: cat.description,
                          image_url: cat.image_url,
                          order_index: cat.order_index
                        }))}
                        className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-xs transition-colors"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
                
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
                    URL personalizada:
                  </label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                </div>
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
                <p className="text-xs text-gray-500 mt-1">
                  Menor número = primeira posição
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  {editingCategory ? 'Atualizar' : 'Criar'} Categoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal da Biblioteca de Banners */}
      {showBannerLibrary && (
        <BannerLibrary
          isModal={true}
          onSelectBanner={(banner) => {
            setFormData(prev => ({ ...prev, image_url: banner.image_url }));
            setShowBannerLibrary(false);
            alert(`✅ Banner "${banner.name}" selecionado para categoria!`);
          }}
          onClose={() => setShowBannerLibrary(false)}
        />
      )}
    </div>
  );
};

export default CategoriesManager;