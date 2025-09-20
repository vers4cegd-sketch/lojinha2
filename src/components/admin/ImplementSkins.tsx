import React, { useState, useEffect } from 'react';
import { Package, Search, Zap, Target, Plus, X, CheckCircle, AlertCircle, Loader, Eye, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { fetchValorantWeapons, processValorantSkins } from '../../lib/valorantApi';

interface Product {
  id: string;
  name: string;
  category_id: string;
  categories?: {
    name: string;
  };
}

interface Skin {
  id: string;
  arma: string;
  nome_skin: string;
  imagem_url: string;
  raridade: string;
  colecao: string;
  weapon_uuid: string;
  skin_uuid: string;
}

interface AccountSkin {
  id: string;
  product_id: string;
  skin_id: string;
  skins: Skin;
}

const ImplementSkins: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [implementMode, setImplementMode] = useState<'api' | 'quantity' | 'library' | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [customQuantity, setCustomQuantity] = useState<number>(50);
  
  // Para modo biblioteca
  const [availableSkins, setAvailableSkins] = useState<Skin[]>([]);
  const [vandalSkins, setVandalSkins] = useState<Skin[]>([]);
  const [libraryMode, setLibraryMode] = useState<'general' | 'vandal'>('general');
  const [filteredSkins, setFilteredSkins] = useState<Skin[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWeapon, setSelectedWeapon] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('');
  const [selectedSkins, setSelectedSkins] = useState<Skin[]>([]);
  
  // Para modo coleção
  const [selectedCollection, setSelectedCollection] = useState('');
  const [randomSkinsQuantity, setRandomSkinsQuantity] = useState<number>(20);
  
  // Para visualizar skins da conta
  const [accountSkins, setAccountSkins] = useState<AccountSkin[]>([]);
  const [showAccountSkins, setShowAccountSkins] = useState(false);

  // Listas únicas para filtros
  const [weapons, setWeapons] = useState<string[]>([]);
  const [rarities, setRarities] = useState<string[]>([]);
  const [collections, setCollections] = useState<string[]>([]);

  useEffect(() => {
    loadValorantProducts();
  }, []);

  useEffect(() => {
    if (implementMode === 'library') {
      loadAvailableSkins();
    }
  }, [implementMode]);

  useEffect(() => {
    if (libraryMode === 'general') {
      filterSkins();
    } else {
      filterVandalSkins();
    }
  }, [availableSkins, vandalSkins, libraryMode, searchTerm, selectedWeapon, selectedRarity]);

  const loadValorantProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name)
        `)
        .order('name');

      if (error) throw error;
      
      // Filtrar apenas produtos de Valorant
      const valorantProducts = (data || []).filter(product => 
        product.categories?.name?.toLowerCase() === 'valorant' ||
        product.name.toLowerCase().includes('valorant') ||
        product.name.toLowerCase().includes('oferta relâmpago') ||
        product.name.toLowerCase().includes('full acesso')
      );
      
      setProducts(valorantProducts);
    } catch (error) {
      console.error('Erro ao carregar produtos Valorant:', error);
    }
  };

  const loadAvailableSkins = async () => {
    try {
      const { data, error } = await supabase
        .from('skins')
        .select('*')
        .order('arma', { ascending: true })
        .order('nome_skin', { ascending: true });

      if (error) throw error;

      setAvailableSkins(data || []);

      // Extrair listas únicas para filtros
      const uniqueWeapons = [...new Set(data?.map(skin => skin.arma) || [])].sort();
      const uniqueRarities = [...new Set(data?.map(skin => skin.raridade) || [])].sort();
      const uniqueCollections = [...new Set(data?.map(skin => skin.colecao) || [])].sort();

      setWeapons(uniqueWeapons);
      setRarities(uniqueRarities);
      setCollections(uniqueCollections);
    } catch (error) {
      console.error('Erro ao carregar skins:', error);
    }
  };

  const filterSkins = () => {
    let filtered = availableSkins;

    if (searchTerm) {
      filtered = filtered.filter(skin =>
        skin.nome_skin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        skin.arma.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedWeapon) {
      filtered = filtered.filter(skin => skin.arma === selectedWeapon);
    }

    if (selectedRarity) {
      filtered = filtered.filter(skin => skin.raridade === selectedRarity);
    }

    setFilteredSkins(filtered);
  };

  const filterVandalSkins = () => {
    let filtered = vandalSkins;

    if (searchTerm) {
      filtered = filtered.filter(skin =>
        skin.nome_skin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        skin.arma.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedRarity) {
      filtered = filtered.filter(skin => skin.raridade === selectedRarity);
    }

    setFilteredSkins(filtered);
  };

  const loadVandalSkins = async () => {
    try {
      console.log('🎯 Carregando skins de Vandal...');
      
      const { data, error } = await supabase
        .from('skins')
        .select('*')
        .ilike('arma', '%vandal%')
        .order('nome_skin', { ascending: true });

      if (error) {
        console.error('❌ Erro ao carregar Vandals:', error);
        throw error;
      }

      console.log(`🎯 Encontradas ${data?.length || 0} skins de Vandal`);
      setVandalSkins(data || []);
    } catch (error) {
      console.error('Erro ao carregar skins de Vandal:', error);
    }
  };
  const loadAccountSkins = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('account_skins')
        .select(`
          *,
          skins (*)
        `)
        .eq('product_id', productId);

      if (error) throw error;
      setAccountSkins(data || []);
    } catch (error) {
      console.error('Erro ao carregar skins da conta:', error);
    }
  };

  // Função para distribuir skins de forma balanceada entre armas
  const distributeSkinsBalanced = (processedSkins: any[], targetCount: number) => {
    console.log('🎯 Iniciando distribuição balanceada de skins...');
    console.log(`📊 Total de skins disponíveis: ${processedSkins.length}`);
    console.log(`🎯 Quantidade alvo: ${targetCount}`);
    
    // Agrupar skins por arma
    const skinsByWeapon = processedSkins.reduce((acc, skin) => {
      if (!acc[skin.arma]) {
        acc[skin.arma] = [];
      }
      acc[skin.arma].push(skin);
      return acc;
    }, {} as Record<string, any[]>);

    const weapons = Object.keys(skinsByWeapon);
    console.log(`🔫 Armas disponíveis (${weapons.length}):`, weapons);
    
    // Log da quantidade de skins por arma
    weapons.forEach(weapon => console.log(`  ${weapon}: ${skinsByWeapon[weapon].length} skins`));
    const selectedSkins: any[] = [];
    
    // Calcular quantas skins por arma (mínimo 1 por arma se possível)
    const minPerWeapon = Math.max(1, Math.floor(targetCount / weapons.length));
    const remainder = targetCount % weapons.length;
    
    // Primeira passada: garantir pelo menos 1 skin por arma
    console.log(`📊 Distribuição: ${minPerWeapon} skins por arma + ${remainder} extras`);
    weapons.forEach((weapon, index) => {
      const weaponSkins = [...skinsByWeapon[weapon]].sort(() => 0.5 - Math.random());
      const takeCount = minPerWeapon + (index < remainder ? 1 : 0);
      const toTake = Math.min(takeCount, weaponSkins.length);
      
      console.log(`🔫 ${weapon}: pegando ${toTake} de ${weaponSkins.length} skins`);
      selectedSkins.push(...weaponSkins.slice(0, toTake));
    });
    
    console.log(`✅ Primeira passada: ${selectedSkins.length} skins selecionadas`);
    
    // Se ainda precisamos de mais skins, pegar aleatoriamente das restantes
    if (selectedSkins.length < targetCount) {
      console.log(`🔄 Precisamos de mais ${targetCount - selectedSkins.length} skins...`);
      const usedSkinUuids = new Set(selectedSkins.map(s => s.skin_uuid));
      
      // Embaralhar todas as skins restantes para distribuição aleatória
      const allRemaining = processedSkins.filter(skin => !usedSkinUuids.has(skin.skin_uuid));
      const remainingSkins = processedSkins
        .filter(skin => !usedSkinUuids.has(skin.skin_uuid))
        .sort(() => 0.5 - Math.random());
      
      const needed = targetCount - selectedSkins.length;
      selectedSkins.push(...remainingSkins.slice(0, needed));
    }
    
    // Embaralhar resultado final para misturar as armas
    const finalSelection = selectedSkins.sort(() => 0.5 - Math.random()).slice(0, targetCount);
    
    // Log da distribuição final
    const finalDistribution = finalSelection.reduce((acc, skin) => {
      acc[skin.arma] = (acc[skin.arma] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('🎯 Distribuição final por arma:', finalDistribution);
    console.log('🎯 Primeiras 10 skins selecionadas:', finalSelection.slice(0, 10).map(s => `${s.arma}: ${s.nome_skin}`));
    
    return finalSelection;
  };
  const implementFromAPI = async () => {
    if (!selectedProduct) return;

    setLoading(true);
    setMessage(null);

    try {
      setMessage({ type: 'success', text: 'Conectando com Valorant API...' });
      
      // 1. Buscar skins da API
      const weapons = await fetchValorantWeapons();
      setMessage({ type: 'success', text: `Processando ${weapons.length} armas...` });
      
      const processedSkins = await processValorantSkins(weapons);
      setMessage({ type: 'success', text: `${processedSkins.length} skins processadas, verificando duplicatas...` });

      // 2. Filtrar skins que já não estão na conta
      const { data: existingSkins } = await supabase
        .from('account_skins')
        .select('skin_id, skins!inner(skin_uuid)')
        .eq('product_id', selectedProduct.id);

      setMessage({ type: 'success', text: 'Selecionando skins aleatórias...' });

      const existingSkinUuids = new Set(
        existingSkins?.map(item => item.skins.skin_uuid) || []
      );

      const availableForAccount = processedSkins.filter(
        skin => !existingSkinUuids.has(skin.skin_uuid)
      );

      if (availableForAccount.length === 0) {
        setMessage({ type: 'error', text: `Todas as ${processedSkins.length} skins já estão nesta conta!` });
        return;
      }

      // 3. Sortear entre 15-295 skins com distribuição balanceada
      const randomCount = Math.floor(Math.random() * (295 - 15 + 1)) + 15;
      const selectedForImplement = distributeSkinsBalanced(availableForAccount, Math.min(randomCount, availableForAccount.length));

      setMessage({ type: 'success', text: `Implementando ${selectedForImplement.length} skins balanceadas de ${Object.keys(availableForAccount.reduce((acc, skin) => { acc[skin.arma] = true; return acc; }, {} as Record<string, boolean>)).length} armas diferentes...` });

      // 4. Buscar IDs das skins no banco
      const skinUuids = selectedForImplement.map(skin => skin.skin_uuid);
      
      // Dividir em chunks de 20 para evitar URLs muito longas
      const chunkSize = 20;
      let dbSkins: any[] = [];
      
      for (let i = 0; i < skinUuids.length; i += chunkSize) {
        const chunk = skinUuids.slice(i, i + chunkSize);
        const { data: chunkData, error: chunkError } = await supabase
          .from('skins')
          .select('id, skin_uuid')
          .in('skin_uuid', chunk);
        
        if (chunkError) {
          console.error('Erro ao buscar chunk de skins:', chunkError);
          throw chunkError;
        }
        
        if (chunkData) {
          dbSkins.push(...chunkData);
        }
      }
      
      console.log(`🔍 Buscando ${skinUuids.length} skins no banco...`);
      console.log(`✅ Encontradas ${dbSkins?.length || 0} skins no banco`);

      // Se não encontrou nenhuma skin, tentar salvar as skins da API primeiro
      if (!dbSkins || dbSkins.length === 0) {
        setMessage({ type: 'success', text: 'Skins não encontradas no banco. Salvando skins da API primeiro...' });
        
        // Salvar as skins processadas no banco
        const skinsToInsert = selectedForImplement.map(skin => ({
          arma: skin.arma,
          nome_skin: skin.nome_skin,
          imagem_url: skin.imagem_url,
          raridade: skin.raridade,
          colecao: skin.colecao,
          weapon_uuid: skin.weapon_uuid,
          skin_uuid: skin.skin_uuid
        }));
        
        // Inserir em chunks para evitar problemas
        const insertChunkSize = 50;
        for (let i = 0; i < skinsToInsert.length; i += insertChunkSize) {
          const insertChunk = skinsToInsert.slice(i, i + insertChunkSize);
          const { error: insertError } = await supabase
            .from('skins')
            .insert(insertChunk);
          
          if (insertError) {
            console.error('Erro ao inserir chunk de skins:', insertError);
            // Continuar mesmo com erro - pode ser duplicata
          }
        }
        
        setMessage({ type: 'success', text: 'Skins salvas! Buscando IDs novamente...' });
        
        // Buscar novamente após inserir
        dbSkins = [];
        for (let i = 0; i < skinUuids.length; i += chunkSize) {
          const chunk = skinUuids.slice(i, i + chunkSize);
          const { data: chunkData } = await supabase
            .from('skins')
            .select('id, skin_uuid')
            .in('skin_uuid', chunk);
          
          if (chunkData) {
            dbSkins.push(...chunkData);
          }
        }
        
        console.log(`🔄 Após inserção: encontradas ${dbSkins?.length || 0} skins no banco`);
      }
      
      if (!dbSkins || dbSkins.length === 0) {
        setMessage({ type: 'error', text: `❌ Erro crítico: não foi possível salvar/encontrar as skins no banco. Verifique a conexão.` });
        return;
      }

      // 5. Criar relacionamentos
      const accountSkinsToInsert = dbSkins.map(skin => ({
        product_id: selectedProduct.id,
        skin_id: skin.id
      }));

      setMessage({ type: 'success', text: 'Salvando no banco de dados...' });

      const { error: insertError, data: insertedData } = await supabase
        .from('account_skins')
        .insert(accountSkinsToInsert);

      if (insertError) throw insertError;

      console.log('✅ Skins implementadas com sucesso:', insertedData?.length || dbSkins.length);

      setMessage({
        type: 'success',
        text: `✅ ${dbSkins.length} skins foram implementadas com sucesso na conta "${selectedProduct.name}"! Distribuídas entre ${Object.keys(selectedForImplement.reduce((acc, skin) => { acc[skin.arma] = true; return acc; }, {} as Record<string, boolean>)).length} armas diferentes. (de ${availableForAccount.length} disponíveis)`
      });

      // Recarregar skins da conta se estiver visualizando
      if (showAccountSkins) {
        loadAccountSkins(selectedProduct.id);
      }

    } catch (error) {
      console.error('Erro ao implementar skins da API:', error);
      console.error('Detalhes do erro:', {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      setMessage({ 
        type: 'error', 
        text: `Erro ao implementar skins da API: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const implementCustomQuantity = async () => {
    if (!selectedProduct || customQuantity < 1) return;

    setLoading(true);
    setMessage(null);

    try {
      setMessage({ type: 'success', text: 'Conectando com Valorant API...' });
      
      // 1. Buscar skins da API
      const weapons = await fetchValorantWeapons();
      setMessage({ type: 'success', text: `Processando ${weapons.length} armas...` });
      
      const processedSkins = await processValorantSkins(weapons);
      setMessage({ type: 'success', text: `${processedSkins.length} skins processadas, verificando duplicatas...` });

      // 2. Filtrar skins que já não estão na conta
      const { data: existingSkins } = await supabase
        .from('account_skins')
        .select('skin_id, skins!inner(skin_uuid)')
        .eq('product_id', selectedProduct.id);

      setMessage({ type: 'success', text: `Selecionando ${customQuantity} skins balanceadas...` });

      const existingSkinUuids = new Set(
        existingSkins?.map(item => item.skins.skin_uuid) || []
      );

      const availableForAccount = processedSkins.filter(
        skin => !existingSkinUuids.has(skin.skin_uuid)
      );

      if (availableForAccount.length === 0) {
        setMessage({ type: 'error', text: `Todas as ${processedSkins.length} skins já estão nesta conta!` });
        return;
      }

      if (availableForAccount.length < customQuantity) {
        setMessage({ type: 'error', text: `Apenas ${availableForAccount.length} skins disponíveis, mas você pediu ${customQuantity}. Reduzindo para ${availableForAccount.length}.` });
      }

      // 3. Selecionar quantidade específica com distribuição balanceada
      const targetCount = Math.min(customQuantity, availableForAccount.length);
      const selectedForImplement = distributeSkinsBalanced(availableForAccount, targetCount);

      setMessage({ type: 'success', text: `Implementando ${selectedForImplement.length} skins selecionadas...` });

      // 4. Buscar IDs das skins no banco
      const skinUuids = selectedForImplement.map(skin => skin.skin_uuid);
      const { data: dbSkins } = await supabase
        .from('skins')
        .select('id, skin_uuid')
        .in('skin_uuid', skinUuids);

      if (!dbSkins || dbSkins.length === 0) {
        setMessage({ type: 'error', text: `Skins não encontradas no banco de ${selectedForImplement.length} selecionadas. Importe as skins primeiro!` });
        return;
      }

      // 5. Criar relacionamentos
      const accountSkinsToInsert = dbSkins.map(skin => ({
        product_id: selectedProduct.id,
        skin_id: skin.id
      }));

      setMessage({ type: 'success', text: 'Salvando no banco de dados...' });

      const { error: insertError, data: insertedData } = await supabase
        .from('account_skins')
        .insert(accountSkinsToInsert);

      if (insertError) throw insertError;

      console.log('✅ Skins implementadas com sucesso:', insertedData?.length || dbSkins.length);

      setMessage({
        type: 'success',
        text: `✅ ${dbSkins.length} skins foram implementadas com sucesso na conta "${selectedProduct.name}"! (de ${availableForAccount.length} disponíveis)`
      });

      // Recarregar skins da conta se estiver visualizando
      if (showAccountSkins) {
        loadAccountSkins(selectedProduct.id);
      }

    } catch (error) {
      console.error('Erro ao implementar quantidade customizada:', error);
      setMessage({ 
        type: 'error', 
        text: `Erro ao implementar skins: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const implementFromCollection = async () => {
    if (!selectedProduct || !selectedCollection) return;

    setLoading(true);
    setMessage(null);

    try {
      setMessage({ type: 'success', text: `Buscando skins da coleção ${selectedCollection}...` });
      
      // 1. Buscar skins da coleção específica
      const { data: collectionSkins, error: collectionError } = await supabase
        .from('skins')
        .select('*')
        .eq('colecao', selectedCollection);

      if (collectionError) throw collectionError;

      if (!collectionSkins || collectionSkins.length === 0) {
        setMessage({ type: 'error', text: `❌ Nenhuma skin encontrada na coleção "${selectedCollection}". Verifique se o nome está correto.` });
        return;
      }

      setMessage({ type: 'success', text: `✅ ${collectionSkins.length} skins encontradas na coleção "${selectedCollection}". Buscando ${randomSkinsQuantity} skins aleatórias...` });

      // 2. Buscar skins aleatórias para completar
      const { data: allSkins, error: allSkinsError } = await supabase
        .from('skins')
        .select('*')
        .neq('colecao', selectedCollection);

      if (allSkinsError) throw allSkinsError;

      // 3. Verificar quais skins já estão na conta
      const { data: existingSkins } = await supabase
        .from('account_skins')
        .select('skin_id')
        .eq('product_id', selectedProduct.id);

      const existingSkinIds = new Set(existingSkins?.map(item => item.skin_id) || []);

      // 4. Filtrar skins disponíveis
      const availableCollectionSkins = collectionSkins.filter(skin => !existingSkinIds.has(skin.id));
      const availableRandomSkins = (allSkins || []).filter(skin => !existingSkinIds.has(skin.id));

      if (availableCollectionSkins.length === 0) {
        setMessage({ type: 'error', text: `❌ Todas as ${collectionSkins.length} skins da coleção "${selectedCollection}" já estão nesta conta!` });
        return;
      }

      // 5. Selecionar skins para implementar
      const skinsToImplement: Skin[] = [];
      
      // Adicionar TODAS as skins da coleção disponíveis
      skinsToImplement.push(...availableCollectionSkins);
      
      // Adicionar quantidade específica de skins aleatórias
      const randomSkinsToAdd = Math.min(randomSkinsQuantity, availableRandomSkins.length);
      
      if (randomSkinsToAdd > 0 && availableRandomSkins.length > 0) {
        // Embaralhar e pegar skins aleatórias
        const shuffledRandomSkins = availableRandomSkins.sort(() => 0.5 - Math.random());
        const selectedRandomSkins = shuffledRandomSkins.slice(0, randomSkinsToAdd);
        skinsToImplement.push(...selectedRandomSkins);
      }

      const actualRandomAdded = skinsToImplement.length - availableCollectionSkins.length;
      setMessage({ type: 'success', text: `🔄 Implementando ${skinsToImplement.length} skins: ${availableCollectionSkins.length} da coleção "${selectedCollection}" + ${actualRandomAdded} aleatórias...` });

      // 6. Criar relacionamentos
      const accountSkinsToInsert = skinsToImplement.map(skin => ({
        product_id: selectedProduct.id,
        skin_id: skin.id
      }));

      const { error: insertError } = await supabase
        .from('account_skins')
        .insert(accountSkinsToInsert);

      if (insertError) throw insertError;

      setMessage({
        type: 'success',
        text: `🎉 ${skinsToImplement.length} skins implementadas com sucesso! ${availableCollectionSkins.length} da coleção "${selectedCollection}" + ${actualRandomAdded} aleatórias.`
      });

      // Recarregar skins da conta se estiver visualizando
      if (showAccountSkins) {
        loadAccountSkins(selectedProduct.id);
      }

    } catch (error) {
      console.error('Erro ao implementar por coleção:', error);
      setMessage({ 
        type: 'error', 
        text: `Erro ao implementar por coleção: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const addSkinToSelection = (skin: Skin) => {
    if (!selectedSkins.find(s => s.id === skin.id)) {
      setSelectedSkins(prev => [...prev, skin]);
    }
  };

  const removeSkinFromSelection = (skinId: string) => {
    setSelectedSkins(prev => prev.filter(s => s.id !== skinId));
  };

  const implementFromLibrary = async () => {
    if (!selectedProduct || selectedSkins.length === 0) return;

    setLoading(true);
    setMessage(null);

    try {
      // Verificar quais skins já estão na conta
      const { data: existingSkins } = await supabase
        .from('account_skins')
        .select('skin_id')
        .eq('product_id', selectedProduct.id)
        .in('skin_id', selectedSkins.map(s => s.id));

      const existingSkinIds = new Set(existingSkins?.map(item => item.skin_id) || []);
      
      // Filtrar skins que não estão na conta
      const skinsToAdd = selectedSkins.filter(skin => !existingSkinIds.has(skin.id));

      if (skinsToAdd.length === 0) {
        setMessage({ type: 'error', text: 'Todas as skins selecionadas já estão nesta conta!' });
        return;
      }

      // Criar relacionamentos
      const accountSkinsToInsert = skinsToAdd.map(skin => ({
        product_id: selectedProduct.id,
        skin_id: skin.id
      }));

      const { error: insertError } = await supabase
        .from('account_skins')
        .insert(accountSkinsToInsert);

      if (insertError) throw insertError;

      setMessage({
        type: 'success',
        text: `${skinsToAdd.length} skins foram implementadas com sucesso na conta "${selectedProduct.name}"!`
      });

      // Limpar seleção
      setSelectedSkins([]);

      // Recarregar skins da conta se estiver visualizando
      if (showAccountSkins) {
        loadAccountSkins(selectedProduct.id);
      }

    } catch (error) {
      console.error('Erro ao implementar skins da biblioteca:', error);
      setMessage({ type: 'error', text: 'Erro ao implementar skins da biblioteca' });
    } finally {
      setLoading(false);
    }
  };

  const removeSkinFromAccount = async (accountSkinId: string) => {
    try {
      const { error } = await supabase
        .from('account_skins')
        .delete()
        .eq('id', accountSkinId);

      if (error) throw error;

      // Recarregar skins da conta
      if (selectedProduct) {
        loadAccountSkins(selectedProduct.id);
      }

      setMessage({ type: 'success', text: 'Skin removida da conta com sucesso!' });
    } catch (error) {
      console.error('Erro ao remover skin da conta:', error);
      setMessage({ type: 'error', text: 'Erro ao remover skin da conta' });
    }
  };

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Implementar Skins</h1>
        <p className="text-gray-600 mt-1">Adicione skins às contas Valorant</p>
      </div>

      {/* Seleção de Conta */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Selecionar Conta Valorant</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              onClick={() => {
                setSelectedProduct(product);
                setImplementMode(null);
                setSelectedSkins([]);
                setShowAccountSkins(false);
              }}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedProduct?.id === product.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
              <p className="text-sm text-gray-600">ID: {product.id}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Seleção de Modo */}
      {selectedProduct && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Escolher Modo de Implementação</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <button
              onClick={() => setImplementMode('api')}
              className={`p-6 border-2 rounded-lg transition-all ${
                implementMode === 'api'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <Zap className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-2">Direto da API</h3>
              <p className="text-sm text-gray-600">
                Sorteia automaticamente 15-295 skins balanceadas da Valorant API
              </p>
            </button>

            <button
              onClick={() => setImplementMode('quantity')}
              className={`p-6 border-2 rounded-lg transition-all ${
                implementMode === 'quantity'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-2">Quantidade</h3>
              <p className="text-sm text-gray-600">
                Escolha exatamente quantas skins quer implementar (balanceadas)
              </p>
            </button>

            <button
              onClick={() => setImplementMode('collection')}
              className={`p-6 border-2 rounded-lg transition-all ${
                implementMode === 'collection'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <Package className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-2">Por Coleção</h3>
              <p className="text-sm text-gray-600">
                Escolha uma coleção específica + skins aleatórias extras
              </p>
            </button>

            <button
              onClick={() => setImplementMode('library')}
              className={`p-6 border-2 rounded-lg transition-all ${
                implementMode === 'library'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <Package className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-2">Da Biblioteca</h3>
              <p className="text-sm text-gray-600">
                Selecione manualmente as skins da biblioteca importada
              </p>
            </button>
          </div>

          {/* Botão para ver skins da conta */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => {
                setShowAccountSkins(!showAccountSkins);
                if (!showAccountSkins) {
                  loadAccountSkins(selectedProduct.id);
                }
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>{showAccountSkins ? 'Ocultar' : 'Ver'} Skins da Conta</span>
            </button>
          </div>
        </div>
      )}

      {/* Implementação da API */}
      {implementMode === 'api' && selectedProduct && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Implementar da API</h2>
          <p className="text-gray-600 mb-4">
            Isso irá sortear entre 15-295 skins balanceadas diretamente da Valorant API e adicionar à conta selecionada. O sistema distribui as skins de forma equilibrada entre todas as armas disponíveis.
          </p>
          <button
            onClick={implementFromAPI}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Implementando...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                <span>Implementar Skins Balanceadas</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Implementação por Quantidade */}
      {implementMode === 'quantity' && selectedProduct && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Implementar Quantidade Específica</h2>
          <p className="text-gray-600 mb-4">
            Escolha exatamente quantas skins quer implementar. O sistema vai distribuir de forma balanceada entre todas as armas disponíveis.
          </p>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantidade de Skins
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="number"
                min="1"
                max="500"
                value={customQuantity}
                onChange={(e) => setCustomQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <div className="flex space-x-2">
                <button
                  onClick={() => setCustomQuantity(50)}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm transition-colors"
                >
                  50
                </button>
                <button
                  onClick={() => setCustomQuantity(100)}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm transition-colors"
                >
                  100
                </button>
                <button
                  onClick={() => setCustomQuantity(200)}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm transition-colors"
                >
                  200
                </button>
                <button
                  onClick={() => setCustomQuantity(300)}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm transition-colors"
                >
                  300
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Mínimo: 1 skin | Máximo: 500 skins
            </p>
          </div>
          
          <button
            onClick={implementCustomQuantity}
            disabled={loading || customQuantity < 1}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Implementando...</span>
              </>
            ) : (
              <>
                <Target className="w-5 h-5" />
                <span>Implementar {customQuantity} Skins</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Implementação por Coleção */}
      {implementMode === 'collection' && selectedProduct && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Implementar por Coleção Específica</h2>
          <p className="text-gray-600 mb-6">
            Digite o nome exato da coleção. O sistema vai adicionar TODAS as skins dessa coleção + a quantidade de skins aleatórias que você escolher.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Coleção
              </label>
              <input
                type="text"
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ex: Kuronami, Prime, Elderflame, Reaver..."
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <p className="text-xs text-gray-500 w-full mb-1">Coleções populares:</p>
                {['Kuronami', 'Prime', 'Elderflame', 'Reaver', 'Glitchpop', 'Ion', 'Sovereign', 'Dragon', 'Oni', 'Singularity', 'Spectrum', 'RGX 11z Pro', 'Champions'].map(collection => (
                  <button
                    key={collection}
                    type="button"
                    onClick={() => setSelectedCollection(collection)}
                    className="px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded text-xs transition-colors"
                  >
                    {collection} {collection === 'Kuronami' ? '🌙' : 
                     collection === 'Prime' ? '⭐' :
                     collection === 'Elderflame' ? '🔥' :
                     collection === 'Reaver' ? '💀' : ''}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantidade de Skins Aleatórias
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={randomSkinsQuantity}
                  onChange={(e) => setRandomSkinsQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <div className="flex space-x-2">
                  <button onClick={() => setRandomSkinsQuantity(0)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm">0</button>
                  <button onClick={() => setRandomSkinsQuantity(20)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm">20</button>
                  <button onClick={() => setRandomSkinsQuantity(50)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm">50</button>
                  <button onClick={() => setRandomSkinsQuantity(100)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm">100</button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Além de TODAS as skins da coleção escolhida</p>
            </div>
          </div>
          
          <button
            onClick={implementFromCollection}
            disabled={loading || !selectedCollection}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:transform-none"
          >
            {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Package className="w-5 h-5" />}
            <span>{loading ? 'Implementando...' : selectedCollection ? `Implementar "${selectedCollection}" + ${randomSkinsQuantity} Aleatórias` : 'Implementar por Coleção'}</span>
          </button>
        </div>
      )}

      {/* Implementação da Biblioteca */}
      {implementMode === 'library' && selectedProduct && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Selecionar da Biblioteca</h2>
          
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative col-span-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar skins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <select className="col-span-1"
              value={selectedWeapon}
              onChange={(e) => setSelectedWeapon(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Todas as armas</option>
              {weapons.map(weapon => (
                <option key={weapon} value={weapon}>{weapon}</option>
              ))}
            </select>

            <select className="col-span-1"
              value={selectedRarity}
              onChange={(e) => setSelectedRarity(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Todas as raridades</option>
              {rarities.map(rarity => (
                <option key={rarity} value={rarity}>{rarity}</option>
              ))}
            </select>
          </div>

          {/* Tabs para Biblioteca */}
          <div className="flex space-x-4 mb-6 border-b border-gray-200">
            <button 
              onClick={() => setLibraryMode('general')}
              className={`pb-2 px-4 border-b-2 font-medium transition-colors ${
                libraryMode === 'general' 
                  ? 'border-purple-500 text-purple-600' 
                  : 'border-transparent text-gray-600 hover:text-purple-600'
              }`}
            >
              📚 Biblioteca Geral ({availableSkins.length})
            </button>
            <button 
              onClick={() => {
                setLibraryMode('vandal');
                loadVandalSkins();
              }}
              className={`pb-2 px-4 border-b-2 font-medium transition-colors ${
                libraryMode === 'vandal' 
                  ? 'border-yellow-500 text-yellow-600' 
                  : 'border-transparent text-gray-600 hover:text-yellow-600'
              }`}
            >
              🎯 Biblioteca Vandal ({vandalSkins.length})
            </button>
          </div>

          {/* Skins Selecionadas */}
          {selectedSkins.length > 0 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900">Skins Selecionadas ({selectedSkins.length})</h3>
                <button
                  onClick={implementFromLibrary}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Implementando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Implementar Selecionadas</span>
                    </>
                  )}
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                {selectedSkins.map((skin) => (
                  <div key={skin.id} className="relative group">
                    <div className="aspect-square bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-lg overflow-hidden border-2 border-yellow-400 shadow-lg">
                      <img
                        src={skin.imagem_url}
                        alt={skin.nome_skin}
                        className="w-full h-full object-contain p-2 drop-shadow-lg"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.pexels.com/photos/9072323/pexels-photo-9072323.jpeg?auto=compress&cs=tinysrgb&w=100';
                        }}
                      />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="truncate font-medium">{skin.nome_skin}</p>
                      <p className="truncate text-yellow-300">{skin.arma}</p>
                    </div>
                    <button
                      onClick={() => removeSkinFromSelection(skin.id)}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grid de Skins Disponíveis */}
          <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 max-h-96 overflow-y-auto border rounded-lg p-4 ${
            libraryMode === 'vandal' 
              ? 'border-yellow-200 bg-yellow-50' 
              : 'border-gray-200'
          }`}>
            {libraryMode === 'vandal' && filteredSkins.length === 0 && vandalSkins.length === 0 && (
              <div className="col-span-full text-center py-8">
                <div className="text-yellow-600 mb-2">🎯</div>
                <p className="text-yellow-700 font-medium">Carregando skins de Vandal...</p>
              </div>
            )}
            {libraryMode === 'vandal' && filteredSkins.length === 0 && vandalSkins.length > 0 && (
              <div className="col-span-full text-center py-8">
                <div className="text-yellow-600 mb-2">🔍</div>
                <p className="text-yellow-700 font-medium">Nenhuma Vandal encontrada com os filtros atuais</p>
              </div>
            )}
            {filteredSkins.map((skin) => (
              <div
                key={skin.id}
                onClick={() => addSkinToSelection(skin)}
                className={`border-2 rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
                  selectedSkins.find(s => s.id === skin.id)
                    ? 'border-green-500 bg-green-50'
                    : libraryMode === 'vandal'
                      ? 'border-yellow-200 hover:border-yellow-400 bg-white'
                      : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className={`aspect-square overflow-hidden rounded-lg mb-2 shadow-sm ${
                  libraryMode === 'vandal'
                    ? 'bg-gradient-to-br from-yellow-100 to-yellow-200'
                    : 'bg-gradient-to-br from-gray-100 to-gray-200'
                }`}>
                  <img
                    src={skin.imagem_url}
                    alt={skin.nome_skin}
                    className="w-full h-full object-contain p-2 hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.pexels.com/photos/9072323/pexels-photo-9072323.jpeg?auto=compress&cs=tinysrgb&w=200';
                    }}
                  />
                </div>
                <h4 className={`font-medium text-xs truncate mb-1 ${
                  libraryMode === 'vandal' ? 'text-yellow-900' : 'text-gray-900'
                }`} title={skin.nome_skin}>
                  {libraryMode === 'vandal' ? '🎯 ' : ''}{skin.nome_skin}
                </h4>
                <p className={`text-xs truncate mb-2 ${
                  libraryMode === 'vandal' ? 'text-yellow-700 font-medium' : 'text-gray-600'
                }`} title={skin.arma}>
                  {skin.arma}
                </p>
                <p className="text-xs text-gray-600 truncate mb-2" title={skin.arma}>{skin.arma}</p>
                <div className="flex gap-1 mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getRarityColor(skin.raridade)}`}>
                    {skin.raridade}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skins da Conta */}
      {showAccountSkins && selectedProduct && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Skins da Conta: {selectedProduct.name} ({accountSkins.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
            {accountSkins.map((accountSkin) => (
              <div key={accountSkin.id} className="border border-gray-200 rounded-lg p-3 relative group">
                <div className="aspect-square overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-2 shadow-sm">
                  <img
                    src={accountSkin.skins.imagem_url}
                    alt={accountSkin.skins.nome_skin}
                    className="w-full h-full object-contain p-2 hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.pexels.com/photos/9072323/pexels-photo-9072323.jpeg?auto=compress&cs=tinysrgb&w=200';
                    }}
                  />
                </div>
                <h4 className="font-medium text-gray-900 text-xs truncate mb-1" title={accountSkin.skins.nome_skin}>
                  {accountSkin.skins.nome_skin}
                </h4>
                <p className="text-xs text-gray-600 truncate mb-2" title={accountSkin.skins.arma}>
                  {accountSkin.skins.arma}
                </p>
                <div className="flex gap-1 mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getRarityColor(accountSkin.skins.raridade)}`}>
                    {accountSkin.skins.raridade}
                  </span>
                </div>
                <button
                  onClick={() => removeSkinFromAccount(accountSkin.id)}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mensagens */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImplementSkins;