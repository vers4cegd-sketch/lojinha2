import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Eye, Upload, X, Check, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Banner {
  id: string;
  name: string;
  description: string;
  image_url: string;
  category: string;
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface BannerLibraryProps {
  isModal?: boolean;
  onSelectBanner?: (banner: Banner) => void;
  onClose?: () => void;
}

const BannerLibrary: React.FC<BannerLibraryProps> = ({ 
  isModal = false, 
  onSelectBanner, 
  onClose 
}) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    category: 'geral',
    tags: [''],
    is_active: true
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [multipleFiles, setMultipleFiles] = useState<File[]>([]);
  const [multiplePreviews, setMultiplePreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [batchUploading, setBatchUploading] = useState(false);

  const categories = [
    { value: 'geral', label: 'Geral' },
    { value: 'valorant', label: 'Valorant' },
    { value: 'cs2', label: 'Counter-Strike 2' },
    { value: 'ea-fc', label: 'EA Sports FC' }
  ];

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banner_library')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Erro ao carregar banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      console.log('🔄 Iniciando upload do banner:', file.name);
      console.log('📁 Arquivo:', {
        name: file.name,
        type: file.type,
        size: file.size,
        sizeInMB: (file.size / 1024 / 1024).toFixed(2) + 'MB'
      });
      
      // Verificar se Supabase está configurado
      if (!supabase) {
        throw new Error('Supabase client não está configurado');
      }
      
      const fileExt = file.name.split('.').pop();
      const fileName = `banner-${Date.now()}.${fileExt}`;
      
      console.log('📝 Nome do arquivo no storage:', fileName);
      
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

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      setImagePreview(publicUrl);
      
      alert('✅ Upload realizado com sucesso!');
      console.log('✅ Upload do banner concluído!');
      console.log('🌐 URL pública:', publicUrl);
      
    } catch (error) {
      console.error('❌ Erro no upload do banner:', error);
      alert('Erro no upload da imagem');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleMultipleFiles(files);
  };

  const handleMultipleFiles = (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    const validFiles = imageFiles.filter(file => file.size <= 5 * 1024 * 1024);
    
    if (imageFiles.length !== files.length) {
      alert('Alguns arquivos foram ignorados por não serem imagens.');
    }
    
    if (validFiles.length !== imageFiles.length) {
      alert('Alguns arquivos foram ignorados por serem maiores que 5MB.');
    }
    
    setMultipleFiles(validFiles);
    
    // Criar previews
    const previews: string[] = [];
    validFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        previews[index] = e.target?.result as string;
        if (previews.length === validFiles.length) {
          setMultiplePreviews([...previews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleBatchUpload = async () => {
    if (multipleFiles.length === 0) return;
    
    setBatchUploading(true);
    const uploadedBanners: any[] = [];
    
    try {
      for (let i = 0; i < multipleFiles.length; i++) {
        const file = multipleFiles[i];
        const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extensão
        
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        
        try {
          // Upload da imagem
          const fileExt = file.name.split('.').pop();
          const uniqueName = `banner-${Date.now()}-${i}.${fileExt}`;
          
          console.log(`📤 Uploading ${i + 1}/${multipleFiles.length}: ${file.name}`);
          setUploadProgress(prev => ({ ...prev, [file.name]: 25 }));
          
          // Verificar se Supabase está configurado
          if (!supabase) {
            throw new Error('Supabase client não está configurado');
          }
          
          const { data, error } = await supabase.storage
            .from('product-images')
            .upload(uniqueName, file, {
              cacheControl: '3600',
              upsert: true,
              contentType: file.type
            });

          if (error) {
            console.error(`❌ Erro no upload de ${file.name}:`, {
              error,
              message: error.message,
              statusCode: error.statusCode,
              details: error
            });
            throw error;
          }

          setUploadProgress(prev => ({ ...prev, [file.name]: 50 }));

          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(uniqueName);

          setUploadProgress(prev => ({ ...prev, [file.name]: 75 }));

          // Criar banner no banco
          const bannerData = {
            name: fileName,
            description: `Banner ${fileName}`,
            image_url: publicUrl,
            category: formData.category,
            tags: [`upload-lote-${Date.now()}`],
            is_active: true
          };

          const { error: insertError } = await supabase
            .from('banner_library')
            .insert([bannerData]);

          if (insertError) throw insertError;

          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
          uploadedBanners.push(bannerData);
          
        } catch (fileError) {
          console.error(`❌ Erro completo no upload de ${file.name}:`, fileError);
          setUploadProgress(prev => ({ ...prev, [file.name]: -1 })); // -1 = erro
        }
        
        // Pequeno delay entre uploads
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      alert(`✅ Upload em lote concluído! ${uploadedBanners.length}/${multipleFiles.length} banners criados.`);
      
      // Limpar estado
      setMultipleFiles([]);
      setMultiplePreviews([]);
      setUploadProgress({});
      loadBanners();
      
    } catch (error) {
      console.error('Erro no upload em lote:', error);
      alert('Erro no upload em lote');
    } finally {
      setBatchUploading(false);
    }
  };

  const removeFileFromBatch = (index: number) => {
    setMultipleFiles(prev => prev.filter((_, i) => i !== index));
    setMultiplePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const files = e.target.files ? Array.from(e.target.files) : [];
    
    if (files.length > 1) {
      handleMultipleFiles(files);
      return;
    }
    
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('Arquivo muito grande. Máximo 5MB.');
        return;
      }

      setImageFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (imageFile) {
        await handleImageUpload(imageFile);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const bannerData = {
        name: formData.name,
        description: formData.description,
        image_url: formData.image_url,
        category: formData.category,
        tags: formData.tags.filter(tag => tag.trim() !== ''),
        is_active: formData.is_active,
        updated_at: new Date().toISOString()
      };

      if (editingBanner) {
        const { error } = await supabase
          .from('banner_library')
          .update(bannerData)
          .eq('id', editingBanner.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('banner_library')
          .insert([bannerData]);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingBanner(null);
      resetForm();
      loadBanners();
    } catch (error) {
      console.error('Erro ao salvar banner:', error);
      alert('Erro ao salvar banner');
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      name: banner.name,
      description: banner.description || '',
      image_url: banner.image_url,
      category: banner.category,
      tags: banner.tags.length > 0 ? banner.tags : [''],
      is_active: banner.is_active
    });
    setImagePreview(banner.image_url);
    setImageFile(null);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este banner?')) return;

    try {
      const { error } = await supabase
        .from('banner_library')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadBanners();
    } catch (error) {
      console.error('Erro ao excluir banner:', error);
      alert('Erro ao excluir banner');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image_url: '',
      category: 'geral',
      tags: [''],
      is_active: true
    });
    setImageFile(null);
    setImagePreview('');
  };

  const addTag = () => {
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, '']
    }));
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const updateTag = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.map((tag, i) => i === index ? value : tag)
    }));
  };

  const filteredBanners = banners.filter(banner => {
    const matchesSearch = banner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         banner.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         banner.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === '' || banner.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'valorant': return 'bg-red-100 text-red-800';
      case 'cs2': return 'bg-orange-100 text-orange-800';
      case 'ea-fc': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const content = (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
            <ImageIcon className="w-8 h-8 text-purple-600" />
            <span>Biblioteca de Banners</span>
          </h1>
          <p className="text-gray-600 mt-1">
            {banners.length} banners disponíveis
          </p>
        </div>
        {!isModal && (
          <button
            onClick={() => {
              setEditingBanner(null);
              resetForm();
              setShowModal(true);
            }}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Banner</span>
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar banners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none transition-all duration-200"
          >
            <option value="">Todas as categorias</option>
            {categories.map(category => (
              <option key={category.value} value={category.value}>{category.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid de Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBanners.map((banner) => (
          <div key={banner.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="aspect-video overflow-hidden bg-gray-100">
              <img
                src={banner.image_url}
                alt={banner.name}
                className="w-full h-full object-cover"
                loading="eager"
                decoding="async"
                fetchpriority="high"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.pexels.com/photos/9072323/pexels-photo-9072323.jpeg?auto=compress&cs=tinysrgb&w=400';
                }}
              />
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
                    {banner.name}
                  </h3>
                  {banner.description && (
                    <p className="text-xs text-gray-600 mb-2">{banner.description}</p>
                  )}
                </div>
                <div className="flex space-x-1 ml-2">
                  {isModal && onSelectBanner ? (
                    <button
                      onClick={() => onSelectBanner(banner)}
                      className="text-green-600 hover:text-green-900 transition-colors p-1 hover:bg-green-50 rounded"
                      title="Selecionar banner"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => window.open(banner.image_url, '_blank')}
                        className="text-blue-600 hover:text-blue-900 transition-colors p-1 hover:bg-blue-50 rounded"
                        title="Ver imagem"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleEdit(banner)}
                        className="text-blue-600 hover:text-blue-900 transition-colors p-1 hover:bg-blue-50 rounded"
                        title="Editar banner"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(banner.id)}
                        className="text-red-600 hover:text-red-900 transition-colors p-1 hover:bg-red-50 rounded"
                        title="Excluir banner"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1 mb-2">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(banner.category)}`}>
                  {categories.find(c => c.value === banner.category)?.label || banner.category}
                </span>
                {banner.tags.slice(0, 2).map((tag, i) => (
                  <span key={i} className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                    {tag}
                  </span>
                ))}
                {banner.tags.length > 2 && (
                  <span className="text-xs text-gray-500">+{banner.tags.length - 2}</span>
                )}
              </div>
              
              <p className="text-xs text-gray-500">
                Criado em: {new Date(banner.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        ))}
      </div>

      {filteredBanners.length === 0 && (
        <div className="text-center py-12">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum banner encontrado</h3>
          <p className="text-gray-600">
            {banners.length === 0 
              ? 'Adicione banners para começar'
              : 'Tente ajustar os filtros de busca'
            }
          </p>
        </div>
      )}

      {/* Modal de Edição/Criação */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl my-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900">
                {editingBanner ? 'Editar Banner' : 'Novo Banner'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Banner
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ex: Banner Valorant Premium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>{category.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Descrição do banner..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Imagem do Banner
                </label>
                
                {/* Área de Drag & Drop */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                    isDragging 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="text-4xl">📁</div>
                    <div>
                      <p className="text-lg font-medium text-gray-700">
                        Arraste e solte suas imagens aqui
                      </p>
                      <p className="text-sm text-gray-500">
                        ou clique para selecionar arquivos
                      </p>
                    </div>
                    <div className="text-xs text-gray-400">
                      Suporte: JPG, PNG, WebP | Máximo: 5MB por arquivo
                    </div>
                  </div>
                </div>
                
                {imagePreview && (
                  <div className="mb-3">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg border border-gray-300"
                    />
                  </div>
                )}
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      📁 Upload Individual ou em Lote
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      disabled={uploadingImage}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-purple-50 file:text-purple-600 hover:file:bg-purple-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Selecione múltiplos arquivos para upload em lote
                    </p>
                  </div>
                  
                  {/* Preview de Upload em Lote */}
                  {multipleFiles.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-700">
                          📚 Upload em Lote ({multipleFiles.length} arquivos)
                        </h4>
                        <button
                          type="button"
                          onClick={handleBatchUpload}
                          disabled={batchUploading}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                        >
                          {batchUploading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Enviando...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              <span>Enviar Todos</span>
                            </>
                          )}
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
                        {multipleFiles.map((file, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                              {multiplePreviews[index] ? (
                                <img
                                  src={multiplePreviews[index]}
                                  alt={file.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                                </div>
                              )}
                            </div>
                            
                            {/* Progress Bar */}
                            {uploadProgress[file.name] !== undefined && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                      uploadProgress[file.name] === -1 
                                        ? 'bg-red-500' 
                                        : uploadProgress[file.name] === 100 
                                        ? 'bg-green-500' 
                                        : 'bg-blue-500'
                                    }`}
                                    style={{ 
                                      width: uploadProgress[file.name] === -1 
                                        ? '100%' 
                                        : `${Math.max(0, uploadProgress[file.name])}%` 
                                    }}
                                  ></div>
                                </div>
                                <div className="text-xs text-white text-center mt-1">
                                  {uploadProgress[file.name] === -1 
                                    ? 'Erro' 
                                    : uploadProgress[file.name] === 100 
                                    ? 'Concluído' 
                                    : `${uploadProgress[file.name]}%`
                                  }
                                </div>
                              </div>
                            )}
                            
                            <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                              {file.name.length > 15 ? file.name.substring(0, 15) + '...' : file.name}
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => removeFileFromBatch(index)}
                              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
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
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Enviar Imagem</span>
                        </>
                      )}
                    </button>
                  )}
                  
                  <div className="text-center text-xs text-gray-500">
                    OU
                  </div>
                  
                  <div>
                    <input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, image_url: e.target.value }));
                        setImagePreview(e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="https://exemplo.com/imagem.jpg"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                {formData.tags.map((tag, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={tag}
                      onChange={(e) => updateTag(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Ex: valorant, premium"
                    />
                    {formData.tags.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTag}
                  className="mt-2 px-4 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Tag</span>
                </button>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  Banner Ativo
                </label>
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
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                {editingBanner ? 'Atualizar' : 'Criar'} Banner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Se for modal, renderizar com overlay
  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-xl max-w-6xl w-full shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center space-x-2">
              <ImageIcon className="w-6 h-6 text-purple-600" />
              <span>Selecionar Banner</span>
            </h2>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
          <div className="p-6">
            {content}
          </div>
        </div>
      </div>
    );
  }

  return content;
};

export default BannerLibrary;