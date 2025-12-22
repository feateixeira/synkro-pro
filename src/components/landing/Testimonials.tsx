import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Carlos Eduardo",
    role: "Dono - Barbearia Vintage",
    content: "Depois do Synkro, minha receita aumentou 40%. Consigo ver tudo em tempo real e nunca mais perdi um agendamento.",
    rating: 5,
    avatar: "CE",
  },
  {
    name: "Ricardo Santos",
    role: "Barbeiro Autônomo",
    content: "A agenda online mudou minha vida. Meus clientes agendam sozinhos e eu recebo lembretes automáticos. Sensacional!",
    rating: 5,
    avatar: "RS",
  },
  {
    name: "Bruno Almeida",
    role: "Dono - King's Barber",
    content: "Com 5 barbeiros, era impossível controlar comissões no papel. Agora é tudo automático e transparente para a equipe.",
    rating: 5,
    avatar: "BA",
  },
];

export const Testimonials = () => {
  return (
    <section className="py-24 px-4 relative bg-secondary/30 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      
      {/* Floating orbs */}
      <div className="absolute top-20 right-10 w-24 h-24 bg-primary/5 rounded-full blur-2xl animate-float" />
      <div className="absolute bottom-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 right-20 w-2 h-2 bg-primary/40 rounded-full animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-1/3 left-1/4 w-3 h-3 bg-primary/30 rounded-full animate-float" style={{ animationDelay: '3s' }} />
      
      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-semibold tracking-wider uppercase mb-4 animate-bounce-subtle">
            Depoimentos
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mt-3 mb-4">
            O que nossos clientes
            <br />
            <span className="text-gradient">estão dizendo</span>
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="glass-card p-6 hover:border-primary/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-lg hover:shadow-primary/10 group"
            >
              <Quote className="w-8 h-8 text-primary/30 mb-4 group-hover:text-primary/50 transition-colors duration-300" />
              
              <p className="text-foreground leading-relaxed mb-6">
                "{testimonial.content}"
              </p>

              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm group-hover:bg-primary/30 group-hover:scale-110 transition-all duration-300">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors duration-300">{testimonial.name}</p>
                  <p className="text-muted-foreground text-xs">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: "2.500+", label: "Barbearias Ativas" },
            { value: "150k+", label: "Agendamentos/mês" },
            { value: "98%", label: "Satisfação" },
            { value: "R$ 2M+", label: "Faturamento Gerenciado" },
          ].map((stat, index) => (
            <div key={index} className="text-center group">
              <p className="text-3xl md:text-4xl font-bold text-gradient group-hover:scale-110 transition-transform duration-300 inline-block">{stat.value}</p>
              <p className="text-muted-foreground text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
