import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, Trash2, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Skin {
  id: string;
  arma: string;
  nome_skin: string;
  imagem_url: string;
  raridade: string;
  colecao: string;
  weapon_uuid: string;
  skin_uuid: string;
  created_at: string;
}

const SkinsManager: React.FC = () => {
  const [skins, setSkins] = useState<Skin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWeapon, setSelectedWeapon] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('');

  // Listas únicas para filtros
  const [weapons, setWeapons] = useState<string[]>([]);
  const [rarities, setRarities] = useState<string[]>([]);
  const [collections, setCollections] = useState<string[]>([]);

  useEffect(() => {
    loadSkins();
  }, []);

  const loadSkins = async () => {
    try {
      const { data, error } = await supabase
        .from('skins')
        .select('*')
        .order('arma', { ascending: true })
        .order('nome_skin', { ascending: true });

      if (error) throw error;

      setSkins(data || []);

      // Extrair listas únicas para filtros
      const uniqueWeapons = [...new Set(data?.map(skin => skin.arma) || [])].sort();
      const uniqueRarities = [...new Set(data?.map(skin => skin.raridade) || [])].sort();
      const uniqueCollections = [...new Set(data?.map(skin => skin.colecao) || [])].sort();

      setWeapons(uniqueWeapons);
      setRarities(uniqueRarities);
      setCollections(uniqueCollections);
    } catch (error) {
      console.error('Erro ao carregar skins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta skin?')) return;

    try {
      const { error } = await supabase
        .from('skins')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadSkins();
    } catch (error) {
      console.error('Erro ao excluir skin:', error);
      alert('Erro ao excluir skin');
    }
  };

  const filteredSkins = skins.filter(skin => {
    const matchesSearch = skin.nome_skin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         skin.arma.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWeapon = selectedWeapon === '' || 
                         skin.arma === selectedWeapon ||
                         (selectedWeapon === 'Vandal' && skin.arma.toLowerCase().includes('vandal'));
    const matchesRarity = selectedRarity === '' || skin.raridade === selectedRarity;
    const matchesCollection = selectedCollection === '' || skin.colecao === selectedCollection;
    
    return matchesSearch && matchesWeapon && matchesRarity && matchesCollection;
  });

  const getRarityColor = (raridade: string) => {
    switch (raridade.toLowerCase()) {
      case 'lendária':
      case 'ultra':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'épica':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'rara':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Biblioteca de Skins</h1>
          <p className="text-gray-600 mt-1">
            {skins.length} skins importadas da Valorant API
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Package className="w-4 h-4" />
          <span>{filteredSkins.length} skins filtradas</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar skins..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={selectedWeapon}
              onChange={(e) => setSelectedWeapon(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none transition-all duration-200"
            >
              <option value="">Todas as armas</option>
              {weapons.map(weapon => (
                <option key={weapon} value={weapon}>
                  {weapon.toLowerCase().includes('vandal') ? '🎯 ' : ''}{weapon}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <select
              value={selectedRarity}
              onChange={(e) => setSelectedRarity(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none transition-all duration-200"
            >
              <option value="">Todas as raridades</option>
              {rarities.map(rarity => (
                <option key={rarity} value={rarity}>{rarity}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none transition-all duration-200"
            >
              <option value="">Todas as coleções</option>
              {collections.map(collection => (
                <option key={collection} value={collection}>{collection}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid de Skins */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredSkins.map((skin) => (
          <div key={skin.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="aspect-video overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
              <img
                src={skin.imagem_url}
                alt={skin.nome_skin}
                className="w-full h-full object-contain p-4"
                loading="eager"
                decoding="async"
                fetchpriority="high"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.pexels.com/photos/9072323/pexels-photo-9072323.jpeg?auto=compress&cs=tinysrgb&w=300';
                }}
              />
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
                    {skin.nome_skin}
                  </h3>
                  <p className="text-xs text-gray-600">{skin.arma}</p>
                </div>
                <div className="flex space-x-1 ml-2">
                  <button
                    onClick={() => window.open(skin.imagem_url, '_blank')}
                    className="text-blue-600 hover:text-blue-900 transition-colors p-1 hover:bg-blue-50 rounded"
                    title="Ver imagem"
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(skin.id)}
                    className="text-red-600 hover:text-red-900 transition-colors p-1 hover:bg-red-50 rounded"
                    title="Excluir skin"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1 mb-2">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getRarityColor(skin.raridade)}`}>
                  {skin.raridade}
                </span>
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 border border-gray-300">
                  {skin.colecao}
                </span>
              </div>
              
              <p className="text-xs text-gray-500">
                Importada em: {new Date(skin.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        ))}
      </div>

      {filteredSkins.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma skin encontrada</h3>
          <p className="text-gray-600">
            {skins.length === 0 
              ? 'Importe skins da Valorant API para começar'
              : 'Tente ajustar os filtros de busca'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default SkinsManager;