// Integração com Valorant API
export interface ValorantWeapon {
  uuid: string;
  displayName: string;
  skins: ValorantSkin[];
}

export interface ValorantSkin {
  uuid: string;
  displayName: string;
  displayIcon: string | null;
  chromas: Array<{
    uuid: string;
    displayName: string;
    displayIcon: string | null;
    fullRender: string | null;
  }>;
  contentTierUuid: string | null;
  themeUuid: string | null;
}

export interface ValorantContentTier {
  uuid: string;
  displayName: string;
  devName: string;
  rank: number;
}

export interface ProcessedSkin {
  arma: string;
  nome_skin: string;
  imagem_url: string;
  raridade: string;
  colecao: string;
  weapon_uuid: string;
  skin_uuid: string;
}

// Cache para content tiers
let contentTiersCache: Record<string, ValorantContentTier> = {};

// Função para delay entre requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Função para retry com backoff exponencial
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delayTime = baseDelay * Math.pow(2, attempt - 1);
      console.warn(`⚠️ Tentativa ${attempt} falhou, tentando novamente em ${delayTime}ms...`);
      await delay(delayTime);
    }
  }
  throw new Error('Máximo de tentativas excedido');
};

// Validar estrutura de dados da API
const validateApiResponse = (data: any, type: 'weapons' | 'contenttiers'): boolean => {
  if (!data || typeof data !== 'object') {
    console.error(`❌ Resposta inválida para ${type}: não é um objeto`);
    return false;
  }
  
  if (data.status !== 200) {
    console.error(`❌ Status da API inválido para ${type}: ${data.status}`);
    return false;
  }
  
  if (!Array.isArray(data.data)) {
    console.error(`❌ Data não é array para ${type}:`, typeof data.data);
    return false;
  }
  
  if (data.data.length === 0) {
    console.warn(`⚠️ Array vazio para ${type}`);
    return false;
  }
  
  return true;
};

// Validar estrutura de weapon
const validateWeapon = (weapon: any): weapon is ValorantWeapon => {
  if (!weapon || typeof weapon !== 'object') return false;
  if (!weapon.uuid || typeof weapon.uuid !== 'string') return false;
  if (!weapon.displayName || typeof weapon.displayName !== 'string') return false;
  if (!Array.isArray(weapon.skins)) return false;
  return true;
};

// Validar estrutura de skin
const validateSkin = (skin: any): boolean => {
  if (!skin || typeof skin !== 'object') return false;
  if (!skin.uuid || typeof skin.uuid !== 'string') return false;
  if (!skin.displayName || typeof skin.displayName !== 'string') return false;
  return true;
};

// Buscar content tiers da API
export const fetchContentTiers = async (): Promise<Record<string, ValorantContentTier>> => {
  if (Object.keys(contentTiersCache).length > 0) {
    console.log('📦 Usando cache de content tiers');
    return contentTiersCache;
  }

  return retryWithBackoff(async () => {
    console.log('🔄 Buscando content tiers...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    
    const response = await fetch('https://valorant-api.com/v1/contenttiers', {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Traking.shop/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      throw new Error('Erro ao fazer parse do JSON da resposta');
    }
    
    if (!validateApiResponse(data, 'contenttiers')) {
      throw new Error('Estrutura de resposta inválida para content tiers');
    }
    
    console.log('📊 Content tiers recebidos:', data.data.length);
    
    contentTiersCache = data.data.reduce((acc: Record<string, ValorantContentTier>, tier: any) => {
      if (tier && tier.uuid && tier.displayName) {
        acc[tier.uuid] = tier;
      }
      return acc;
    }, {});
    
    console.log('✅ Content tiers processados:', Object.keys(contentTiersCache).length);
    
    return contentTiersCache;
  });
};

// Buscar armas e skins da Valorant API
export const fetchValorantWeapons = async (): Promise<ValorantWeapon[]> => {
  return retryWithBackoff(async () => {
    console.log('🔄 Conectando com Valorant API para buscar armas...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout
    
    const response = await fetch('https://valorant-api.com/v1/weapons', {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Traking.shop/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      throw new Error('Erro ao fazer parse do JSON da resposta');
    }
    
    if (!validateApiResponse(data, 'weapons')) {
      throw new Error('Estrutura de resposta inválida para weapons');
    }
    
    console.log('📊 Resposta da API recebida:', { status: data.status, weaponsCount: data.data.length });
    
    // Log de TODAS as armas para debug
    console.log('🎮 LISTA COMPLETA DE ARMAS DA API:');
    data.data.forEach((weapon: any, index: number) => {
      console.log(`${index + 1}. "${weapon.displayName}" (UUID: ${weapon.uuid}) - ${weapon.skins?.length || 0} skins`);
    });
    
    // Validar e filtrar weapons válidas
    const validWeapons = data.data.filter((weapon: any) => {
      if (!validateWeapon(weapon)) {
        console.warn(`⚠️ Weapon inválida ignorada: ${weapon?.displayName || 'Nome não definido'}`);
        return false;
      }
      return true;
    });
    
    // Procurar especificamente por Vandal
    const vandalWeapons = validWeapons.filter((weapon: any) => {
      const name = weapon.displayName.toLowerCase();
      const isVandal = name.includes('vandal') || name === 'vandal';
      if (isVandal) {
        console.log('🎯 VANDAL ENCONTRADA!', {
          name: weapon.displayName,
          uuid: weapon.uuid,
          skinsCount: weapon.skins?.length || 0
        });
      }
      return isVandal;
    });
    
    console.log(`🔫 Total de Vandals encontradas: ${vandalWeapons.length}`);
    
    if (validWeapons.length === 0) {
      throw new Error('Nenhuma weapon válida encontrada na resposta da API');
    }
    
    console.log('✅ API funcionando! Armas válidas encontradas:', validWeapons.length);
    return validWeapons;
  });
};

// Função para obter melhor imagem disponível
const getBestImageUrl = (skin: ValorantSkin): string | null => {
  // Prioridade: fullRender das chromas > displayIcon das chromas > displayIcon da skin
  if (skin.chromas && Array.isArray(skin.chromas) && skin.chromas.length > 0) {
    // Procurar fullRender primeiro
    for (const chroma of skin.chromas) {
      if (chroma && chroma.fullRender && typeof chroma.fullRender === 'string') {
        return chroma.fullRender;
      }
    }
    
    // Se não encontrou fullRender, procurar displayIcon das chromas
    for (const chroma of skin.chromas) {
      if (chroma && chroma.displayIcon && typeof chroma.displayIcon === 'string') {
        return chroma.displayIcon;
      }
    }
  }
  
  // Fallback para displayIcon da skin
  if (skin.displayIcon && typeof skin.displayIcon === 'string') {
    return skin.displayIcon;
  }
  
  return null;
};

// Processar skins e filtrar as válidas
export const processValorantSkins = async (weapons: ValorantWeapon[]): Promise<ProcessedSkin[]> => {
  console.log('🔄 Processando skins de', weapons.length, 'armas...');
  console.log('🔍 Armas que serão processadas:', weapons.map(w => w.displayName).sort());
  
  let contentTiers: Record<string, ValorantContentTier> = {};
  try {
    contentTiers = await fetchContentTiers();
  } catch (error) {
    console.warn('⚠️ Erro ao buscar content tiers, usando raridade padrão:', error);
  }
  
  const processedSkins: ProcessedSkin[] = [];
  let skippedCount = 0;
  let errorCount = 0;

  for (const weapon of weapons) {
    if (!validateWeapon(weapon)) {
      console.warn(`⚠️ Weapon inválida ignorada: ${weapon?.displayName || 'Nome não definido'}`);
      errorCount++;
      continue;
    }

    console.log(`🔍 Processando "${weapon.displayName}": ${weapon.skins.length} skins`);
    
    // Log detalhado para Vandal especificamente
    const isVandal = weapon.displayName.toLowerCase().includes('vandal') || weapon.displayName.toLowerCase() === 'vandal';
    if (isVandal) {
      console.log('🎯 PROCESSANDO VANDAL!', {
        name: weapon.displayName,
        uuid: weapon.uuid,
        skinsCount: weapon.skins.length,
        primeiras5Skins: weapon.skins.map(s => s.displayName).slice(0, 5)
      });
    }

    for (const skin of weapon.skins) {
      try {
        if (!validateSkin(skin)) {
          console.warn(`⚠️ Skin inválida ignorada: ${skin?.displayName || 'Nome não definido'}`);
          errorCount++;
          continue;
        }

        // Ignorar skins "Standard" (sem skin)
        const skinNameLower = skin.displayName.toLowerCase();
        const weaponNameLower = weapon.displayName.toLowerCase();
        
        if (skinNameLower.includes('standard') || 
            skinNameLower === weaponNameLower ||
            skinNameLower.includes('melee') && weaponNameLower.includes('melee')) {
          if (isVandal) {
            console.log(`⏭️ Skin Vandal padrão ignorada: ${skin.displayName}`);
          }
          skippedCount++;
          continue;
        }

        // Determinar a melhor imagem disponível
        const imageUrl = getBestImageUrl(skin);
        
        if (!imageUrl) {
          if (isVandal) {
            console.warn(`⚠️ Skin Vandal sem imagem ignorada: ${skin.displayName}`);
          }
          skippedCount++;
          continue;
        }

        // Determinar raridade baseada no content tier
        let raridade = 'Comum';
        if (skin.contentTierUuid && contentTiers[skin.contentTierUuid]) {
          const tier = contentTiers[skin.contentTierUuid];
          if (typeof tier.rank === 'number') {
            switch (tier.rank) {
              case 0:
                raridade = 'Comum';
                break;
              case 1:
                raridade = 'Rara';
                break;
              case 2:
                raridade = 'Épica';
                break;
              case 3:
                raridade = 'Lendária';
                break;
              case 4:
                raridade = 'Ultra';
                break;
              default:
                raridade = tier.displayName || 'Comum';
            }
          } else {
            raridade = tier.displayName || 'Comum';
          }
        }

        // Determinar coleção (baseado no nome da skin)
        let colecao = 'Padrão';
        const skinName = skin.displayName.toLowerCase();
        
        if (skinName.includes('prime')) colecao = 'Prime';
        else if (skinName.includes('elderflame')) colecao = 'Elderflame';
        else if (skinName.includes('reaver')) colecao = 'Reaver';
        else if (skinName.includes('glitchpop')) colecao = 'Glitchpop';
        else if (skinName.includes('ion')) colecao = 'Ion';
        else if (skinName.includes('sovereign')) colecao = 'Sovereign';
        else if (skinName.includes('dragon')) colecao = 'Dragon';
        else if (skinName.includes('oni')) colecao = 'Oni';
        else if (skinName.includes('singularity')) colecao = 'Singularity';
        else if (skinName.includes('spectrum')) colecao = 'Spectrum';
        else if (skinName.includes('rgx')) colecao = 'RGX 11z Pro';
        else if (skinName.includes('champions')) colecao = 'Champions';
        else if (skinName.includes('forsaken')) colecao = 'Forsaken';
        else if (skinName.includes('phantom')) colecao = 'Phantom';
        else if (skinName.includes('vandal')) colecao = 'Vandal';
        else if (skinName.includes('operator')) colecao = 'Operator';
        else if (skinName.includes('sheriff')) colecao = 'Sheriff';
        else if (skinName.includes('orion')) colecao = 'Orion';
        else if (skinName.includes('nebula')) colecao = 'Nebula';
        else if (skinName.includes('avalanche')) colecao = 'Avalanche';
        else if (skinName.includes('magepunk')) colecao = 'Magepunk';
        else if (skinName.includes('wasteland')) colecao = 'Wasteland';
        else if (skinName.includes('luxe')) colecao = 'Luxe';
        else if (skinName.includes('sakura')) colecao = 'Sakura';
        else if (skinName.includes('convex')) colecao = 'Convex';
        else if (skinName.includes('artisan')) colecao = 'Artisan';
        else if (skinName.includes('sentinels')) colecao = 'Sentinels of Light';
        else if (skinName.includes('ruination')) colecao = 'Ruination';
        else if (skinName.includes('protocol')) colecao = 'Protocol 781-A';
        else if (skinName.includes('infantry')) colecao = 'Infantry';
        else if (skinName.includes('tethered')) colecao = 'Tethered Realms';

        // Validar dados finais antes de adicionar
        if (!weapon.uuid || !skin.uuid || !skin.displayName || !weapon.displayName || !imageUrl) {
          if (isVandal) {
            console.warn(`⚠️ Dados incompletos para skin Vandal: ${skin.displayName}`);
          }
          errorCount++;
          continue;
        }

        // Log especial para skins de Vandal
        if (isVandal) {
          console.log(`✅ Skin Vandal PROCESSADA: "${skin.displayName}" (${raridade}) - ${imageUrl ? 'COM IMAGEM' : 'SEM IMAGEM'}`);
        }
        
        processedSkins.push({
          arma: weapon.displayName,
          nome_skin: skin.displayName,
          imagem_url: imageUrl,
          raridade,
          colecao,
          weapon_uuid: weapon.uuid,
          skin_uuid: skin.uuid
        });
        
      } catch (skinError) {
        if (isVandal) {
          console.error(`❌ Erro ao processar skin Vandal ${skin?.displayName || 'desconhecida'}:`, skinError);
        }
        errorCount++;
        continue;
      }
    }
  }

  console.log(`✅ Processamento concluído: ${processedSkins.length} skins válidas (TODAS), ${skippedCount} ignoradas, ${errorCount} erros`);
  
  // Log das armas processadas
  const weaponCounts = processedSkins.reduce((acc, skin) => {
    acc[skin.arma] = (acc[skin.arma] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('📊 Skins por arma:', weaponCounts);
  
  // Verificar se Vandal está presente
  const vandalSkins = processedSkins.filter(skin => skin.arma.toLowerCase().includes('vandal'));
  console.log(`🎯 RESULTADO FINAL - Skins de Vandal processadas: ${vandalSkins.length}`);
  if (vandalSkins.length > 0) {
    console.log('🎯 Primeiras 5 skins Vandal processadas:', vandalSkins.slice(0, 5).map(s => s.nome_skin));
  } else {
    console.error('❌ NENHUMA SKIN VANDAL FOI PROCESSADA!');
  }
  
  if (processedSkins.length === 0) {
    throw new Error('Nenhuma skin válida foi processada');
  }
  
  return processedSkins;
};

// Mapear raridade para tipo usado no sistema
export const mapRarityToType = (raridade: string): string => {
  switch (raridade.toLowerCase()) {
    case 'lendária':
    case 'ultra':
      return 'LIT';
    case 'épica':
      return 'Exc';
    case 'rara':
      return 'Pro';
    default:
      return 'Del';
  }
};