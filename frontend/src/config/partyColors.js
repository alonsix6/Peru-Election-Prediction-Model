export const PARTY_COLORS = {
  'Rafael López Aliaga': {
    party: 'Renovación Popular',
    primary: '#0EA5E9',
    bg: '#E0F2FE',
    text: '#0369A1'
  },
  'Keiko Fujimori': {
    party: 'Fuerza Popular',
    primary: '#F97316',
    bg: '#FFF7ED',
    text: '#C2410C'
  },
  'Carlos Álvarez': {
    party: 'País para Todos',
    primary: '#EAB308',
    bg: '#FEFCE8',
    text: '#854D0E'
  },
  'López Chau': {
    party: 'Ahora Nación',
    primary: '#DC2626',
    bg: '#FEF2F2',
    text: '#991B1B'
  },
  'Roberto Sánchez Palomino': {
    party: 'Juntos por el Perú',
    primary: '#16A34A',
    bg: '#F0FDF4',
    text: '#166534'
  },
  'Jorge Nieto': {
    party: 'Partido del Buen Gobierno',
    primary: '#D97706',
    bg: '#FFFBEB',
    text: '#92400E'
  },
  'Ricardo Belmont': {
    party: 'Partido Cívico Obras',
    primary: '#D97706',
    bg: '#FFFBEB',
    text: '#92400E'
  },
  'César Acuña': {
    party: 'Alianza para el Progreso',
    primary: '#1E40AF',
    bg: '#EFF6FF',
    text: '#1E3A8A'
  },
  'Marisol Pérez Tello': {
    party: 'Primero la Gente',
    primary: '#0D9488',
    bg: '#F0FDFA',
    text: '#115E59'
  },
  'Wolfgang Grozo': {
    party: 'Integridad Democrática',
    primary: '#4338CA',
    bg: '#EEF2FF',
    text: '#312E81'
  },
  'Carlos Espá': {
    party: 'SíCreo',
    primary: '#0284C7',
    bg: '#F0F9FF',
    text: '#075985'
  },
  'Yonhy Lescano': {
    party: 'Cooperación Popular',
    primary: '#7C3AED',
    bg: '#F5F3FF',
    text: '#5B21B6'
  },
  'Mario Vizcarra': {
    party: 'Perú Primero',
    primary: '#0369A1',
    bg: '#F0F9FF',
    text: '#075985'
  },
  'George Forsyth': {
    party: 'Somos Perú',
    primary: '#DC2626',
    bg: '#FEF2F2',
    text: '#991B1B'
  },
  'Fernando Olivera': {
    party: 'Frente de la Esperanza',
    primary: '#16A34A',
    bg: '#F0FDF4',
    text: '#166534'
  },
  'Charlie Carrasco': {
    party: 'Demócrata Unido Perú',
    primary: '#065F46',
    bg: '#ECFDF5',
    text: '#064E3B'
  },
  'José Luna': {
    party: 'Podemos Perú',
    primary: '#1D4ED8',
    bg: '#EFF6FF',
    text: '#1E3A8A'
  },
  'Herbert Caller': {
    party: 'Partido Patriótico del Perú',
    primary: '#1D4ED8',
    bg: '#EFF6FF',
    text: '#1E3A8A'
  },
  'Mesías Guevara': {
    party: 'Partido Morado',
    primary: '#7C3AED',
    bg: '#F5F3FF',
    text: '#5B21B6'
  },
  'Roberto Chiabra': {
    party: 'Unidad Nacional',
    primary: '#1E40AF',
    bg: '#EFF6FF',
    text: '#1E3A8A'
  },
  'Fiorella Molinelli': {
    party: 'Fuerza y Libertad',
    primary: '#DC2626',
    bg: '#FEF2F2',
    text: '#991B1B'
  },
  'Rafael Belaúnde Llosa': {
    party: 'Libertad Popular',
    primary: '#0369A1',
    bg: '#F0F9FF',
    text: '#075985'
  },
  'Vladimir Cerrón': {
    party: 'Perú Libre',
    primary: '#DC2626',
    bg: '#FEF2F2',
    text: '#991B1B'
  },
  'José Williams': {
    party: 'Avanza País',
    primary: '#2563EB',
    bg: '#EFF6FF',
    text: '#1E40AF'
  },
  'Enrique Valderrama': {
    party: 'Partido Aprista Peruano',
    primary: '#B91C1C',
    bg: '#FEF2F2',
    text: '#7F1D1D'
  },
  'Paul Jaimes': {
    party: 'Progresemos',
    primary: '#0284C7',
    bg: '#F0F9FF',
    text: '#075985'
  },
  'Ronald Atencio': {
    party: 'Alianza Venceremos',
    primary: '#B45309',
    bg: '#FFFBEB',
    text: '#92400E'
  },
};

const DEFAULT_COLOR = { party: 'Independiente', primary: '#6B7280', bg: '#F3F4F6', text: '#374151' };

export function getPartyColor(name) {
  return PARTY_COLORS[name] || DEFAULT_COLOR;
}
