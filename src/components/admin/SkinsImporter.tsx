import React, { useState } from 'react';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { fetchValorantWeapons, processValorantSkins, ProcessedSkin } from '../../lib/valorantApi';
import { Download, Zap, Target } from '../icons';

interface ImportStats {
  novas: number;
  atualizadas: number;
  erros: number;
  total: number;
}

const SkinsImporter: React.FC = () => {
  const [importing, setImporting] = useState(false);
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const [detailedErrors, setDetailedErrors] = useState<string[]>([]);

  const importSkins = async () => {
    setImporting(true);
    setError(null);
    setStats(null);
    setDetailedErrors([]);
    setProgress('🔄 Conectando com a Valorant API (INCLUINDO VANDAL)...');

    try {
      // Garantir autenticação para operações admin
      setProgress('🔐 Verificando autenticação...');
      
      let isAuthenticated = false;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('✅ Usuário já autenticado:', user.email);
          isAuthenticated = true;
        }
      } catch (authError) {
        console.log('⚠️ Sem autenticação prévia, criando sessão admin...');
      }
      
      if (!isAuthenticated) {
        // Criar sessão anônima para operações admin
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.warn('⚠️ Falha na autenticação anônima:', error);
          // Continuar mesmo assim - algumas operações podem funcionar
        } else {
          console.log('✅ Sessão admin criada com sucesso');
        }
      }

      // Testar conexão com Supabase primeiro
      setProgress('🔍 Testando conexão com banco de dados...');
      const { error: testError } = await supabase
        .from('skins')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('❌ Erro de conexão Supabase:', testError);
        throw new Error(`❌ Erro de conexão com banco: ${testError.message}`);
      }
      console.log('✅ Conexão com Supabase OK');

      // 1. Buscar dados da API
      setProgress('🌐 Buscando TODAS as armas da Valorant API (incluindo Vandal)...');
      console.log('🚀 Iniciando teste da Valorant API...');
      const weapons = await fetchValorantWeapons();
      
      if (!weapons || weapons.length === 0) {
        console.error('❌ Nenhuma arma retornada da API');
        throw new Error('❌ Nenhuma arma foi retornada da API Valorant');
      }
      
      // VERIFICAR SE TEM VANDAL NAS ARMAS
      const vandalWeapons = weapons.filter(weapon => {
        const name = weapon.displayName.toLowerCase();
        return name.includes('vandal') || name === 'vandal';
      });
      
      console.log('🔫 VERIFICAÇÃO DE VANDAL NA IMPORTAÇÃO GERAL:');
      console.log(`📊 Total de armas: ${weapons.length}`);
      console.log(`🎯 Vandals encontradas: ${vandalWeapons.length}`);
      if (vandalWeapons.length > 0) {
        vandalWeapons.forEach(weapon => {
          console.log(`🎯 VANDAL: "${weapon.displayName}" - ${weapon.skins.length} skins`);
        });
      } else {
        console.error('❌ NENHUMA VANDAL ENCONTRADA NA IMPORTAÇÃO GERAL!');
        console.log('🔍 Primeiras 10 armas:', weapons.slice(0, 10).map(w => w.displayName));
      }
      
      console.log('✅ API testada com sucesso! Armas:', weapons.length);
      setProgress(`⚙️ Processando ${weapons.length} armas (${vandalWeapons.length} Vandals)...`);

      // 2. Processar skins
      console.log('🔄 Iniciando processamento de skins...');
      const processedSkins = await processValorantSkins(weapons);
      
      if (!processedSkins || processedSkins.length === 0) {
        console.error('❌ Nenhuma skin processada');
        throw new Error('❌ Nenhuma skin válida foi processada da API');
      }
      
      // VERIFICAR SE TEM SKINS DE VANDAL PROCESSADAS
      const vandalSkins = processedSkins.filter(skin => 
        skin.arma.toLowerCase().includes('vandal')
      );
      
      console.log('🎯 SKINS DE VANDAL PROCESSADAS:');
      console.log(`📊 Total de skins processadas: ${processedSkins.length}`);
      console.log(`🎯 Skins de Vandal: ${vandalSkins.length}`);
      if (vandalSkins.length > 0) {
        console.log('🎯 Primeiras 5 skins Vandal:', vandalSkins.slice(0, 5).map(s => s.nome_skin));
      } else {
        console.error('❌ NENHUMA SKIN DE VANDAL FOI PROCESSADA!');
      }
      
      console.log('✅ Skins processadas:', processedSkins.length);
      setProgress(`💾 Encontradas ${processedSkins.length} skins (${vandalSkins.length} Vandals). Salvando no banco...`);

      // 3. Salvar no banco de dados
      const importStats: ImportStats = {
        novas: 0,
        atualizadas: 0,
        erros: 0,
        total: processedSkins.length
      };

      const errors: string[] = [];
      let processedCount = 0;
      let vandalCount = 0;

      for (let i = 0; i < processedSkins.length; i++) {
        const skin = processedSkins[i];
        processedCount++;
        
        const isVandal = skin.arma.toLowerCase().includes('vandal');
        if (isVandal) vandalCount++;
        
        // Atualizar progresso a cada 10 skins para melhor performance
        if (processedCount % 10 === 0 || processedCount === processedSkins.length) {
          setProgress(`💾 Salvando skin ${processedCount}/${processedSkins.length} (${vandalCount} Vandals): ${skin.nome_skin.substring(0, 30)}...`);
        }

        try {
          // Validar dados da skin antes de salvar
          if (!skin.weapon_uuid || !skin.skin_uuid || !skin.nome_skin || !skin.arma) {
            const errorMsg = `❌ Skin inválida: ${skin.nome_skin || 'Nome não definido'} - dados incompletos`;
            errors.push(errorMsg);
            importStats.erros++;
            if (isVandal) {
              console.error('❌ SKIN VANDAL INVÁLIDA:', skin);
            }
            continue;
          }

          // Pequeno delay para evitar sobrecarga do banco
          if (i > 0 && i % 50 === 0) {
            await new Promise(resolve => setTimeout(resolve, 200));
            setProgress(`⏳ Pausa técnica... ${processedCount}/${processedSkins.length}`);
          }

          // Verificar se a skin já existe (com timeout)
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          const { data: existingSkin } = await supabase
            .from('skins')
            .select('id')
            .eq('weapon_uuid', skin.weapon_uuid)
            .eq('skin_uuid', skin.skin_uuid)
            .maybeSingle()
            .abortSignal(controller.signal);
          
          clearTimeout(timeoutId);

          if (existingSkin) {
            // Atualizar skin existente
            const updateController = new AbortController();
            const updateTimeoutId = setTimeout(() => updateController.abort(), 10000);
            
            const { error: updateError } = await supabase
              .from('skins')
              .update({
                arma: skin.arma,
                nome_skin: skin.nome_skin,
                imagem_url: skin.imagem_url,
                raridade: skin.raridade,
                colecao: skin.colecao,
                updated_at: new Date().toISOString()
              })
              .eq('weapon_uuid', skin.weapon_uuid)
              .eq('skin_uuid', skin.skin_uuid)
              .abortSignal(updateController.signal);
            
            clearTimeout(updateTimeoutId);

            if (updateError) {
              console.error('❌ Erro de atualização:', updateError);
              const errorMsg = `❌ Erro ao atualizar ${skin.nome_skin}: ${updateError.message}`;
              errors.push(errorMsg);
              importStats.erros++;
              if (isVandal) {
                console.error('❌ ERRO AO ATUALIZAR VANDAL:', updateError);
              }
            } else {
              if (isVandal) {
                console.log('🎯 VANDAL ATUALIZADA:', skin.nome_skin);
              } else {
                console.log('✅ Skin atualizada:', skin.nome_skin);
              }
              importStats.atualizadas++;
            }
          } else {
            // Criar nova skin
            const insertController = new AbortController();
            const insertTimeoutId = setTimeout(() => insertController.abort(), 10000);
            
            // Inserir nova skin diretamente
            const { error: insertError, data: insertedData } = await supabase
              .from('skins')
              .insert([{
                arma: skin.arma,
                nome_skin: skin.nome_skin,
                imagem_url: skin.imagem_url,
                raridade: skin.raridade,
                colecao: skin.colecao,
                weapon_uuid: skin.weapon_uuid,
                skin_uuid: skin.skin_uuid
              }])
              .abortSignal(insertController.signal);
            
            clearTimeout(insertTimeoutId);

            if (insertError) {
              console.error('❌ Erro de inserção:', insertError);
              console.error('❌ Dados da skin:', skin);
              const errorMsg = `❌ Erro ao inserir ${skin.nome_skin}: ${insertError.message}`;
              errors.push(errorMsg);
              importStats.erros++;
              if (isVandal) {
                console.error('❌ ERRO CRÍTICO AO INSERIR VANDAL:', insertError);
              }
            } else {
              if (isVandal) {
                console.log('🎯 VANDAL NOVA INSERIDA:', skin.nome_skin, insertedData);
              } else {
                console.log('✅ Skin NOVA inserida:', skin.nome_skin);
              }
              importStats.novas++;
            }
          }
        } catch (skinError) {
          console.error(`Erro detalhado na skin ${skin.nome_skin}:`, skinError);
          const errorMsg = `❌ Erro ao processar ${skin.nome_skin}: ${skinError instanceof Error ? skinError.message : 'Erro desconhecido'}`;
          errors.push(errorMsg);
          importStats.erros++;
          if (isVandal) {
            console.error('❌ ERRO GERAL NA VANDAL:', skinError);
          }
        }
      }

      // VERIFICAÇÃO FINAL DE VANDALS NO BANCO
      setProgress('🔍 Verificando Vandals salvas no banco...');
      const { data: finalVandals, error: finalError } = await supabase
        .from('skins')
        .select('*')
        .ilike('arma', '%vandal%');
      
      if (finalError) {
        console.error('❌ Erro ao verificar Vandals finais:', finalError);
      } else {
        console.log(`🎯 RESULTADO FINAL: ${finalVandals?.length || 0} Vandals no banco`);
        if (finalVandals && finalVandals.length > 0) {
          console.log('🎯 Vandals salvas:', finalVandals.map(v => v.nome_skin).slice(0, 10));
        }
      }
      setStats(importStats);
      setDetailedErrors(errors);
        
      if (importStats.erros > 0) {
        console.warn(`⚠️ Importação concluída com ${importStats.erros} erros de ${importStats.total} skins (${vandalCount} Vandals processadas)`);
      } else {
        console.log(`✅ Importação 100% bem-sucedida: ${importStats.novas + importStats.atualizadas} skins processadas (${vandalCount} Vandals)`);
      }
      setProgress(`🎉 Importação concluída! ${vandalCount} Vandals processadas, ${finalVandals?.length || 0} no banco`);
    } catch (err) {
      console.error('❌ Erro completo na importação:', {
        error: err,
        stack: err instanceof Error ? err.stack : 'No stack trace'
      });
      console.error('Erro na importação:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido na importação';
      setError(`❌ ${errorMessage}`);
      setDetailedErrors([errorMessage]);
    } finally {
      setImporting(false);
    }
  };

  const testConnection = async () => {
    try {
      setProgress('🔍 Testando conexão com Valorant API...');
      
      // Testar Valorant API
      const response = await fetch('https://valorant-api.com/v1/version');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Valorant está online:', data);
      } else {
        throw new Error(`❌ API Valorant retornou status ${response.status}`);
      }
      
      // Testar Supabase
      setProgress('🔍 Testando conexão com Supabase...');
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('❌ Usuário não autenticado');
      }
      
      const { error: dbError } = await supabase
        .from('skins')
        .select('count')
        .limit(1);
      
      if (dbError) throw dbError;
      
      setProgress('✅ Todas as conexões OK! Pronto para importar.');
    } catch (error) {
      console.error('❌ Erro ao testar conexão:', error);
      setProgress(`❌ Erro no teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const testSupabaseConnection = async () => {
    try {
      console.log('🔍 Testando conexão com Supabase...');
      const { data, error } = await supabase
        .from('skins')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('❌ Erro de conexão Supabase:', error);
        setProgress('❌ Erro de conexão com banco de dados');
      } else {
        console.log('✅ Conexão Supabase OK');
        setProgress('✅ Conexão com banco confirmada!');
      }
    } catch (error) {
      console.error('❌ Erro ao testar Supabase:', error);
    }
  };

  const debugWeapons = async () => {
    try {
      setProgress('🔍 Fazendo debug completo das armas da API...');
      const weapons = await fetchValorantWeapons();
      
      console.log('🎮 === DEBUG COMPLETO DAS ARMAS ===');
      console.log(`📊 Total de armas: ${weapons.length}`);
      console.log('');
      
      weapons.forEach((weapon, index) => {
        const isVandal = weapon.displayName.toLowerCase().includes('vandal');
        const prefix = isVandal ? '🎯' : '  ';
        console.log(`${prefix} ${index + 1}. "${weapon.displayName}" (${weapon.skins.length} skins) - UUID: ${weapon.uuid}`);
      });
      
      console.log('');
      const vandalWeapons = weapons.filter(w => 
        w.displayName.toLowerCase().includes('vandal')
      );
      
      console.log('🔫 === RESULTADO DA BUSCA POR VANDAL ===');
      console.log(`📊 Vandals encontradas: ${vandalWeapons.length}`);
      if (vandalWeapons.length > 0) {
        vandalWeapons.forEach((weapon, index) => {
          console.log(`🎯 ${index + 1}. "${weapon.displayName}" - ${weapon.skins.length} skins`);
          console.log(`   UUID: ${weapon.uuid}`);
          console.log(`   Primeiras 5 skins: ${weapon.skins.slice(0, 5).map(s => s.displayName).join(', ')}`);
        });
      } else {
        console.error('❌ NENHUMA VANDAL ENCONTRADA!');
        console.log('🔍 Armas que contêm "van":', weapons.filter(w => w.displayName.toLowerCase().includes('van')).map(w => w.displayName));
        console.log('🔍 Armas que contêm "rifle":', weapons.filter(w => w.displayName.toLowerCase().includes('rifle')).map(w => w.displayName));
      }
      
      setProgress(`✅ Debug concluído: ${weapons.length} armas, ${vandalWeapons.length} Vandals. Veja o console para detalhes!`);
    } catch (error) {
      console.error('❌ Erro ao listar armas:', error);
      setProgress(`❌ Erro ao fazer debug: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };
  const importVandalOnly = async () => {
    setImporting(true);
    setError(null);
    setStats(null);
    setDetailedErrors([]);
    setProgress('🎯 FORÇANDO importação de Vandal - MODO DEBUG TOTAL...');

    try {
      // Garantir autenticação
      setProgress('🔐 Verificando autenticação e limpando cache...');
      
      let isAuthenticated = false;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('✅ Usuário já autenticado:', user.email);
          isAuthenticated = true;
        }
      } catch (authError) {
        console.log('⚠️ Sem autenticação prévia, criando sessão admin...');
      }
      
      if (!isAuthenticated) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.warn('⚠️ Falha na autenticação anônima:', error);
        } else {
          console.log('✅ Sessão admin criada com sucesso');
        }
      }

      // Buscar dados da API
      setProgress('🌐 FORÇANDO busca na Valorant API...');
      const weapons = await fetchValorantWeapons();
      
      console.log('🔍 Total de armas recebidas da API:', weapons.length);
      console.log('🔍 Nomes de todas as armas:', weapons.map(w => w.displayName).sort());
      
      // Filtrar apenas Vandal
      const vandalWeapons = weapons.filter(weapon => {
        const name = weapon.displayName.toLowerCase();
        const isVandal = name.includes('vandal') || name === 'vandal';
        console.log(`🔍 Testando arma "${weapon.displayName}": ${isVandal ? '✅ É VANDAL!' : '❌ não é vandal'}`);
        return isVandal;
      }
      );
      
      console.log('🎯 Armas que contêm "vandal":', vandalWeapons.map(w => w.displayName));
      
      if (vandalWeapons.length === 0) {
        console.error('❌ NENHUMA VANDAL ENCONTRADA!');
        console.log('🔍 Todas as armas disponíveis na API:', weapons.map(w => `"${w.displayName}"`).sort());
        throw new Error('❌ Nenhuma arma com "vandal" no nome foi encontrada na API. Verifique o console para ver todas as armas disponíveis.');
      }
      
      console.log('🎯 Vandals que serão processadas:', vandalWeapons.map(w => `"${w.displayName}" (${w.skins.length} skins)`));
      setProgress(`⚙️ Processando ${vandalWeapons.length} Vandal(s)...`);

      // Processar apenas skins de Vandal
      const processedSkins = await processValorantSkins(vandalWeapons);
      
      if (!processedSkins || processedSkins.length === 0) {
        console.error('❌ NENHUMA SKIN DE VANDAL PROCESSADA!');
        throw new Error('❌ Nenhuma skin de Vandal foi processada com sucesso. Verifique os logs no console.');
      }
      
      console.log('✅ Total de skins de Vandal processadas:', processedSkins.length);
      console.log('✅ Nomes das skins processadas:', processedSkins.map(s => s.nome_skin).slice(0, 10));
      setProgress(`💾 FORÇANDO salvamento de ${processedSkins.length} skins de Vandal...`);

      // PRIMEIRO: Deletar todas as Vandals existentes para forçar inserção
      console.log('🗑️ DELETANDO todas as Vandals existentes para forçar inserção...');
      const { error: deleteError } = await supabase
        .from('skins')
        .delete()
        .ilike('arma', '%vandal%');
      
      if (deleteError) {
        console.warn('⚠️ Erro ao deletar Vandals existentes:', deleteError);
      } else {
        console.log('✅ Vandals existentes deletadas com sucesso');
      }

      // Salvar no banco
      const importStats: ImportStats = {
        novas: 0,
        atualizadas: 0,
        erros: 0,
        total: processedSkins.length
      };

      const errors: string[] = [];

      for (let i = 0; i < processedSkins.length; i++) {
        const skin = processedSkins[i];
        
        setProgress(`💾 FORÇANDO inserção ${i + 1}/${processedSkins.length}: ${skin.nome_skin.substring(0, 40)}...`);

        try {
          // Validar dados antes de salvar
          if (!skin.weapon_uuid || !skin.skin_uuid || !skin.nome_skin || !skin.arma) {
            console.error('❌ Skin Vandal com dados incompletos:', skin);
            errors.push(`❌ Skin inválida: ${skin.nome_skin || 'Nome não definido'} - dados incompletos`);
            importStats.erros++;
            continue;
          }
          
          // FORÇAR INSERÇÃO DIRETA (sem verificar se existe)
          console.log(`🔥 FORÇANDO inserção da skin: ${skin.nome_skin}`);
          const { error: insertError, data: insertedData } = await supabase
            .from('skins')
            .insert([{
              arma: skin.arma,
              nome_skin: skin.nome_skin,
              imagem_url: skin.imagem_url,
              raridade: skin.raridade,
              colecao: skin.colecao,
              weapon_uuid: skin.weapon_uuid,
              skin_uuid: skin.skin_uuid
            }])
            .select();

          if (insertError) {
            console.error('❌ ERRO CRÍTICO ao inserir skin Vandal:', insertError);
            console.error('❌ Dados completos da skin:', JSON.stringify(skin, null, 2));
            errors.push(`❌ ERRO CRÍTICO ao inserir ${skin.nome_skin}: ${insertError.message}`);
            importStats.erros++;
          } else {
            console.log(`🎯 SUCESSO! Skin Vandal inserida: ${skin.nome_skin}`, insertedData);
            importStats.novas++;
          }
        } catch (skinError) {
          console.error(`❌ Erro geral ao processar skin Vandal ${skin.nome_skin}:`, skinError);
          const errorMsg = `❌ Erro ao processar ${skin.nome_skin}: ${skinError instanceof Error ? skinError.message : 'Erro desconhecido'}`;
          errors.push(errorMsg);
          importStats.erros++;
        }
      }

      // VERIFICAR SE REALMENTE SALVOU
      setProgress('🔍 Verificando se as Vandals foram realmente salvas...');
      const { data: savedVandals, error: checkError } = await supabase
        .from('skins')
        .select('*')
        .ilike('arma', '%vandal%');
      
      if (checkError) {
        console.error('❌ Erro ao verificar Vandals salvas:', checkError);
      } else {
        console.log(`🎯 CONFIRMAÇÃO: ${savedVandals?.length || 0} Vandals encontradas no banco após inserção`);
        if (savedVandals && savedVandals.length > 0) {
          console.log('🎯 Primeiras 5 Vandals salvas:', savedVandals.slice(0, 5).map(s => s.nome_skin));
        }
      }

      setStats(importStats);
      setDetailedErrors(errors);
      
      if (importStats.erros === 0) {
        setProgress(`🎯 VANDAL 100% SALVA! ${importStats.novas} skins inseridas. Verificadas: ${savedVandals?.length || 0}`);
        console.log('🎉 SUCESSO TOTAL na importação de Vandal!');
      } else {
        setProgress(`🎯 Vandal salva com ${importStats.erros} erros de ${importStats.total}. Verificadas: ${savedVandals?.length || 0}`);
        console.warn(`⚠️ Importação concluída com erros: ${importStats.erros}/${importStats.total}`);
      }
      
    } catch (err) {
      console.error('❌ Erro na importação de Vandal:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`❌ ${errorMessage}`);
      setDetailedErrors([errorMessage]);
    } finally {
      setImporting(false);
    }
  };
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Importação de Skins</h2>
            <p className="text-gray-600 mt-1">Importe todas as skins do Valorant automaticamente</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={importSkins}
              disabled={importing}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:transform-none disabled:cursor-not-allowed"
            >
              {importing ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Importando...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" size={20} />
                  <span>Importar da Valorant API</span>
                </>
              )}
            </button>
            <button
              onClick={testConnection}
              disabled={importing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <span>Testar API</span>
            </button>
            <button
              onClick={debugWeapons}
              disabled={importing}
              className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <span>Debug Armas</span>
            </button>
            <button
              onClick={importVandalOnly}
              disabled={importing}
              className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              {importing ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Importando...</span>
                </>
              ) : (
                <>
                  <Target className="w-4 h-4" size={16} />
                  <span>Só Vandal</span>
                </>
              )}
            </button>
            <button
              onClick={testSupabaseConnection}
              disabled={importing}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <span>Testar DB</span>
            </button>
            <button
              onClick={async () => {
                try {
                  setProgress('🔍 Verificando Vandals no banco...');
                  const { data: vandals, error } = await supabase
                    .from('skins')
                    .select('*')
                    .ilike('arma', '%vandal%');
                  
                  if (error) {
                    console.error('❌ Erro ao buscar Vandals:', error);
                    setProgress('❌ Erro ao verificar banco');
                  } else {
                    console.log(`🎯 VANDALS NO BANCO: ${vandals?.length || 0}`);
                    if (vandals && vandals.length > 0) {
                      console.log('🎯 Lista de Vandals:', vandals.map(v => v.nome_skin));
                    }
                    setProgress(`🎯 Encontradas ${vandals?.length || 0} Vandals no banco`);
                  }
                } catch (error) {
                  console.error('❌ Erro:', error);
                }
              }}
              disabled={importing}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <span>Ver Vandals DB</span>
            </button>
          </div>
        </div>

        {/* Progress */}
        {importing && progress && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Loader className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-blue-800 text-sm">{progress}</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-red-800 text-sm">Erro: {error}</span>
            </div>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-green-800 font-semibold">{stats.novas}</p>
                  <p className="text-green-600 text-sm">Skins Novas</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-blue-800 font-semibold">{stats.atualizadas}</p>
                  <p className="text-blue-600 text-sm">Skins Atualizadas</p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-red-800 font-semibold">{stats.erros}</p>
                  <p className="text-red-600 text-sm">Erros</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Download className="w-5 h-5 text-gray-600" size={20} />
                <div>
                  <p className="text-gray-800 font-semibold">{stats.total}</p>
                  <p className="text-gray-600 text-sm">Total Processadas</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Como funciona:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Conecta com a API oficial do Valorant</li>
            <li>• Importa TODAS as armas e TODAS as suas skins (sem limite)</li>
            <li>• Ignora skins "Standard" (sem customização)</li>
            <li>• Organiza por raridade e coleção automaticamente</li>
            <li>• Evita duplicatas - apenas atualiza se já existir</li>
            <li>• Salva imagens em alta qualidade</li>
            <li>• Processa centenas de skins automaticamente</li>
          </ul>
        </div>
      </div>

      {/* Detailed Errors */}
      {detailedErrors.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalhes dos Erros</h3>
          <div className="max-h-64 overflow-y-auto">
            {detailedErrors.map((error, index) => (
              <div key={index} className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                {error}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkinsImporter;