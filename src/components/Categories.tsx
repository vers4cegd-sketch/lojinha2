import React from 'react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface CategoriesProps {
  onCategoryClick: (category: string) => void;
}

const Categories: React.FC<CategoriesProps> = ({ onCategoryClick }) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      
      // Mapear categorias do banco para o formato esperado
      const mappedCategories = (data || []).map(cat => ({
        name: cat.name,
        id: cat.slug,
        image: cat.image_url || getDefaultImage(cat.slug)
      }));
      
      setCategories(mappedCategories);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      // Em caso de erro, usar array vazio
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultImage = (slug: string) => {
    switch (slug) {
      case 'valorant':
        return '/apps.21507.13663857844271189.4c1de202-3961-4c40-a0aa-7f4f1388775a (1).png';
      case 'counter-strike':
        return '/4R5byRa.png';
      case 'ea-sports-fc':
        return '/022239a9673a747fed6f50be0e0da132.jpg';
      default:
        return '/apps.21507.13663857844271189.4c1de202-3961-4c40-a0aa-7f4f1388775a (1).png';
    }
  };

  const defaultCategories = [
    {
      name: 'Valorant',
      id: 'valorant',
      image: '/apps.21507.13663857844271189.4c1de202-3961-4c40-a0aa-7f4f1388775a (1).png'
    },
    {
      name: 'Counter-Strike',
      id: 'counter-strike',
      image: '/4R5byRa.png'
    },
    {
      name: 'EA Sports FC',
      id: 'ea-sports-fc',
      image: '/022239a9673a747fed6f50be0e0da132.jpg'
    }
  ];

  if (loading) {
    return (
      <section className="bg-black py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">CATEGORIAS</h2>
            <p className="text-lg text-gray-300">
              Carregando categorias...
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-black py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">CATEGORIAS</h2>
          <p className="text-lg text-gray-300">
            Escolha seu jogo favorito e encontre a conta perfeita
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((category, index) => (
            <div
              key={index}
              onClick={() => onCategoryClick(category.id)}
              className="group relative rounded-lg overflow-hidden shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-red-500/20 cursor-pointer h-[550px]"
            >
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="eager"
                decoding="async"
                fetchpriority="high"
              />
              
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              
              {/* Title overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {category.name}
                </h3>
                <div className="w-full h-0.5 bg-white"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;