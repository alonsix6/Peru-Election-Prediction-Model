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
    primary: '#6D28D9',
    bg: '#F5F3FF',
    text: '#4C1D95'
  },
};

const DEFAULT_COLOR = { party: 'Independiente', primary: '#6B7280', bg: '#F3F4F6', text: '#374151' };

export function getPartyColor(name) {
  return PARTY_COLORS[name] || DEFAULT_COLOR;
}
