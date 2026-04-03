const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'primera', label: 'Primera Vuelta' },
  { id: 'segunda', label: 'Segunda Vuelta' },
  { id: 'metodologia', label: 'Metodología' },
];

export default function TabNav({ activeTab, onTabChange }) {
  return (
    <nav style={{
      display: 'flex', gap: '4px', padding: '0 16px',
      background: '#0F172A', borderBottom: '1px solid #334155',
      overflowX: 'auto', scrollbarWidth: 'none',
      msOverflowStyle: 'none',
    }}>
      {TABS.map(tab => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: active ? 600 : 400,
              color: active ? '#F1F5F9' : '#94A3B8',
              background: 'transparent',
              border: 'none',
              borderBottom: active ? '2px solid #38BDF8' : '2px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              minHeight: '44px',
              transition: 'color 0.2s, border-color 0.2s',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
