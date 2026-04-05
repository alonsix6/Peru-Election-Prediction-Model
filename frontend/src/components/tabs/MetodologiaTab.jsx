import {
  Database, TrendingUp, Shuffle, BarChart3, Scale, AlertTriangle,
  BookOpen, ChevronRight, Users, Target, Layers, Zap, Shield, Eye, MapPin
} from 'lucide-react';

function PipelineStep({ icon: Icon, label, sublabel }) {
  return (
    <div style={{
      flex: 1, minWidth: 140, maxWidth: 200,
      background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: 12,
      padding: 16, textAlign: 'center',
    }}>
      <Icon size={24} color="#1D4ED8" style={{ marginBottom: 8 }} />
      <div style={{ fontSize: 14, fontWeight: 600, color: '#1C1917' }}>{label}</div>
      <div style={{ fontSize: 12, color: '#78716C', marginTop: 4 }}>{sublabel}</div>
    </div>
  );
}

function StepRow({ number, title, description, isLast }) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '20px 0' }}>
        <div style={{
          width: 36, height: 36, minWidth: 36, borderRadius: '50%',
          background: '#EFF6FF', color: '#1D4ED8', fontWeight: 700, fontSize: 15,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {number}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1C1917', marginBottom: 6 }}>{title}</div>
          <div style={{ fontSize: 13, color: '#78716C', lineHeight: 1.6 }}>{description}</div>
        </div>
      </div>
      {!isLast && <div style={{ height: 1, background: '#E5E0D8', marginLeft: 52 }} />}
    </div>
  );
}

function FeatureCard({ icon: Icon, iconColor, title, description }) {
  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: 12,
      padding: 20, flex: 1, minWidth: 200,
    }}>
      <Icon size={32} color={iconColor} style={{ marginBottom: 12 }} />
      <div style={{ fontSize: 15, fontWeight: 700, color: '#1C1917', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: '#78716C', lineHeight: 1.6 }}>{description}</div>
    </div>
  );
}

function LimitationItem({ text }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0' }}>
      <div style={{
        width: 8, height: 8, minWidth: 8, borderRadius: '50%',
        background: '#D97706', marginTop: 5,
      }} />
      <div style={{ fontSize: 13, color: '#78716C', lineHeight: 1.6 }}>{text}</div>
    </div>
  );
}

export default function MetodologiaTab() {
  const pipelineSteps = [
    { icon: Database, label: 'Datos', sublabel: '25 encuestas + Polymarket' },
    { icon: Scale, label: 'Ponderación', sublabel: 'Peso por precisión' },
    { icon: Shuffle, label: '10,000 simulaciones', sublabel: 'Monte Carlo' },
    { icon: Target, label: 'Resultado', sublabel: 'Probabilidades' },
  ];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 40,
      maxWidth: 760, margin: '0 auto',
    }}>

      {/* SECTION 1: Hero intro */}
      <div>
        <h2 style={{
          fontSize: 24, fontWeight: 700, color: '#1C1917',
          margin: '0 0 12px',
        }}>
          ¿Cómo funciona este modelo?
        </h2>
        <p style={{
          fontSize: 16, color: '#78716C', lineHeight: 1.7, margin: '0 0 28px',
        }}>
          Combinamos encuestas reales de 6 casas encuestadoras peruanas con datos de
          Polymarket — un mercado donde la gente apuesta dinero real sobre quién va a ganar.
          Luego simulamos la elección 10,000 veces para calcular las probabilidades. Así de simple.
        </p>

        {/* Pipeline diagram */}
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center',
          justifyContent: 'center', flexWrap: 'wrap',
        }}>
          {pipelineSteps.map((step, i) => (
            <div key={i} style={{ display: 'contents' }}>
              <PipelineStep icon={step.icon} label={step.label} sublabel={step.sublabel} />
              {i < pipelineSteps.length - 1 && (
                <ChevronRight size={20} color="#C9C4BB" style={{ flexShrink: 0 }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: Paso a paso */}
      <div style={{
        background: '#FFFFFF', border: '1px solid #E5E0D8',
        borderRadius: 12, padding: '24px 28px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Layers size={20} color="#1D4ED8" />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1C1917', margin: 0 }}>
            Así calcula el modelo, paso a paso
          </h3>
        </div>

        <StepRow
          number={1}
          title="Recopilamos las encuestas"
          description="Tomamos 25 encuestas de 6 casas encuestadoras: IEP, Datum, Ipsos, CPI, CIT y CID Latinoamérica. Cada una preguntó a más de 1,200 personas en todo el Perú — urbano y rural — por quién votarían. La última encuesta incorporada es el estudio Datum del 1-4 de abril (n=3,000, la muestra más grande del ciclo), publicada el día de inicio de la veda electoral."
        />
        <StepRow
          number={2}
          title="Les damos peso según su historial"
          description="No todas las encuestadoras aciertan igual. IEP tuvo el menor error absoluto medio en las elecciones de 2021, así que le damos más peso (1.25x). CID Latinoamérica es nueva en el modelo y tiene la muestra más grande (n=2,120) pero sin historial previo en elecciones peruanas (0.80x). Las encuestas más recientes también pesan más que las antiguas — el decaimiento es exponencial."
        />
        <StepRow
          number={3}
          title="Incluimos lo que dice el mercado"
          description="Polymarket es un mercado donde la gente apuesta dinero real sobre quién va a ganar. Hoy tiene más de $6.3 millones apostados. Le damos un peso de ~28% al mercado y ~72% a las encuestas. Cuando empiece la veda electoral (5 de abril), el peso del mercado sube exponencialmente hasta 77% el día de la elección, porque las encuestas se congelan pero Polymarket sigue captando señales frescas."
        />
        <StepRow
          number={4}
          title="Simulamos 10,000 elecciones"
          description="Corremos la elección 10,000 veces con variaciones aleatorias calibradas para la volatilidad peruana. Usamos distribuciones de cola pesada (t-Student) para capturar eventos extremos. En el 35% de las simulaciones incluimos shocks: el líder puede colapsar -5 a -15 puntos (15% de las sims), el segundo puede caer (10%), o un candidato menor puede subir +5 a +12 puntos como Castillo en 2021 (10%). De esas 10,000 simulaciones sale la probabilidad de cada candidato."
        />
        <StepRow
          number={5}
          title="Simulamos la segunda vuelta"
          description="Para las simulaciones donde ningún candidato supera el 50%, tomamos a los dos primeros y simulamos la segunda vuelta. Los votos de los eliminados se transfieren según afinidad ideológica (70% al candidato de su bloque, 30% al otro), pero limitados por el rechazo definitivo de cada finalista. Si un candidato le cae mal al 63% de la población (como Keiko), esos votos se van al voto blanco. Por eso nuestro modelo predice un voto blanco alto (~45%) en un escenario Aliaga vs Keiko."
          isLast
        />
      </div>

      {/* SECTION 3: Lo que nos hace diferentes */}
      <div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1C1917', margin: '0 0 16px' }}>
          Lo que nos hace diferentes
        </h3>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <FeatureCard
            icon={Zap}
            iconColor="#D97706"
            title="Sorpresas incluidas"
            description="En el 35% de las simulaciones incluimos shocks: un candidato que colapsa, otro que sube de repente, un escándalo. En Perú, 3 de las últimas 4 elecciones tuvieron sorpresas significativas — las modelamos explícitamente."
          />
          <FeatureCard
            icon={Eye}
            iconColor="#1D4ED8"
            title="Transparencia total"
            description="No escondemos nada. Mostramos los rangos de incertidumbre, el peso de cada encuestadora, los escenarios de riesgo, y explicamos por qué nuestros números difieren de Polymarket. Si estamos equivocados, queremos que sepas por qué."
          />
          <FeatureCard
            icon={Shield}
            iconColor="#059669"
            title="Datos reales, no opiniones"
            description="Todo número que ves viene de encuestas publicadas o de apuestas reales con $6.3M en volumen. No inventamos datos, no ajustamos a mano, no tenemos favoritos. El modelo corre solo cada 30 minutos con un watchdog que garantiza la continuidad."
          />
        </div>
      </div>

      {/* SECTION 4: Limitaciones */}
      <div style={{
        background: '#FFFBEB', borderLeft: '4px solid #FDE68A',
        borderRadius: '0 12px 12px 0', padding: '20px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <AlertTriangle size={20} color="#D97706" />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1C1917', margin: 0 }}>
            Lo que el modelo NO puede hacer
          </h3>
        </div>

        <LimitationItem text="Predecir escándalos o retiradas de candidatos que aún no han ocurrido. Si mañana un candidato se retira, el modelo no lo sabe hasta que Polymarket reaccione." />
        <LimitationItem text="Eliminar el margen de error de las encuestas (±2.2 a ±2.8 puntos). Lo que hacemos es incluir esa incertidumbre explícitamente en los rangos." />
        <LimitationItem text="Capturar al 100% el voto rural o el voto oculto. IEP es la encuestadora que mejor lo hace, por eso le damos más peso (1.25x), pero ninguna encuesta es perfecta." />
        <LimitationItem text="Garantizar que Polymarket refleje la realidad peruana. Los traders son mayoritariamente internacionales y pueden no entender los matices locales." />
      </div>

      {/* Nota analítica: sesgo geográfico */}
      <div style={{
        background: '#FFFFFF', border: '1px solid #E5E0D8', borderLeft: '4px solid #1D4ED8',
        borderRadius: '0 12px 12px 0', padding: '20px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <MapPin size={16} color="#1D4ED8" />
          <h4 style={{ fontSize: 15, fontWeight: 600, color: '#1C1917', margin: 0 }}>
            Sesgo geográfico en las encuestas
          </h4>
        </div>
        <p style={{ color: '#78716C', fontSize: 13, lineHeight: 1.7, margin: '0 0 8px' }}>
          Los datos de IEP (28-31 marzo) por macrozona revelan que Roberto Sánchez lidera en
          Perú rural con 16.3% — superando a Keiko (9.3%) y Aliaga (3.0%) — y en el Oriente
          con 14.6%. Sin embargo, en Lima Metropolitana solo alcanza 1.7%. Como las muestras
          están ponderadas hacia Lima, su intención de voto total aparece en 6.7%.
        </p>
        <p style={{ color: '#78716C', fontSize: 13, lineHeight: 1.7, margin: '0 0 8px' }}>
          Este perfil geográfico es casi idéntico al de Castillo en 2021, quien llegó al 18.9% real.
          El 24.1% de indecisos en zonas rurales representa la mayor bolsa de volatilidad no
          capturada por ninguna encuesta nacional.
        </p>
        <p style={{ color: '#8C877F', fontSize: 12, margin: 0 }}>
          Fuente: IEP / @bernal_gallegos, campo 28-31 marzo 2026.
        </p>
      </div>

      {/* SECTION 5: Fuentes */}
      <div style={{
        background: '#FFFFFF', border: '1px solid #E5E0D8',
        borderRadius: 12, padding: '24px 28px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <BookOpen size={20} color="#1D4ED8" />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1C1917', margin: 0 }}>
            De dónde vienen los datos
          </h3>
        </div>

        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          {/* Encuestas */}
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{
              fontSize: 13, fontWeight: 700, color: '#1C1917',
              textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
            }}>
              Encuestas (6 casas, 25 encuestas)
            </div>
            {[
              { name: 'IEP', via: 'La República', weight: '1.25x' },
              { name: 'Datum', via: 'El Comercio / Cuarto Poder', weight: '1.10x' },
              { name: 'Ipsos', via: 'Perú21', weight: '1.00x' },
              { name: 'CPI', via: 'RPP Noticias', weight: '0.95x' },
              { name: 'CIT', via: 'Centro de Investigaciones Tecnológicas', weight: '0.85x' },
              { name: 'CID', via: 'CID Latinoamérica', weight: '0.80x' },
            ].map((s, i) => (
              <div key={i} style={{ fontSize: 13, lineHeight: 2, display: 'flex', justifyContent: 'space-between' }}>
                <span>
                  <span style={{ fontWeight: 600, color: '#1C1917' }}>{s.name}</span>
                  <span style={{ color: '#8C877F' }}> — {s.via}</span>
                </span>
                <span style={{ color: '#1D4ED8', fontWeight: 500, fontSize: 12 }}>{s.weight}</span>
              </div>
            ))}
          </div>

          {/* Otras fuentes */}
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{
              fontSize: 13, fontWeight: 700, color: '#1C1917',
              textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
            }}>
              Otras fuentes
            </div>
            {[
              { name: 'Polymarket', detail: 'polymarket.com ($6.3M en volumen)' },
              { name: 'ONPE', detail: 'Resultados oficiales 2021' },
              { name: 'Wikipedia', detail: 'Tracker de encuestas 2026' },
            ].map((s, i) => (
              <div key={i} style={{ fontSize: 13, lineHeight: 2 }}>
                <span style={{ fontWeight: 600, color: '#1C1917' }}>{s.name}</span>
                <span style={{ color: '#8C877F' }}> — {s.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
