import React from 'react';
import { Star } from 'lucide-react';

const Testimonials: React.FC = () => {
  const testimonials = [
    {
      name: 'Carlos',
      role: 'Cliente Valorant',
      date: '20/08/2025',
      content: 'Excelente serviço! A conta chegou rapidamente e exatamente como descrito. Suporte muito atencioso.',
      rating: 5,
    },
    {
      name: 'Maria',
      role: 'Cliente CS2',
      date: '18/08/2025',
      content: 'Primeira vez comprando e fiquei impressionada com a qualidade. Todas as skins estavam lá!',
      rating: 5,
    },
    {
      name: 'João',
      role: 'Cliente FIFA',
      date: '15/08/2025',
      content: 'Comprei várias contas aqui e nunca tive problema. Recomendo para todos os amigos.',
      rating: 5,
    },
    {
      name: 'Ana',
      role: 'Cliente Valorant',
      date: '12/08/2025',
      content: 'Atendimento 24/7 é real mesmo! Tive um problema às 2h da manhã e me atenderam na hora.',
      rating: 5,
    },
  ];

  return (
    <section id="depoimentos" className="bg-black py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            O QUE NOSSOS CLIENTES ESTÃO DIZENDO
          </h2>
          <p className="text-lg text-gray-300">
            Mais de 3 mil clientes satisfeitos com nossas contas premium
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded-lg p-6 transform transition-all duration-300 hover:scale-105 hover:bg-gray-700"
            >
              <div className="flex space-x-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                ))}
              </div>
              
              <p className="text-white mb-4 text-sm leading-relaxed">
                "{testimonial.content}"
              </p>
              
              <div className="border-t border-gray-600 pt-4">
                <p className="text-white font-medium">{testimonial.name}</p>
                <p className="text-gray-400 text-sm">{testimonial.role}</p>
                <p className="text-gray-500 text-xs mt-1">{testimonial.date}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300">
            VER TODAS NO DISCORD
          </button>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;