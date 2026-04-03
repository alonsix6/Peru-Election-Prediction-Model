import {
  Database, TrendingUp, Shuffle, BarChart3, Scale, AlertTriangle,
  BookOpen, ChevronRight, Users, Target, Layers, Zap, Shield, Eye
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
    { icon: Database, label: 'Datos', sublabel: '16 encuestas + Polymarket' },
    { icon: Scale, label: 'Ponderacion', sublabel: 'Peso por precision' },
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
          Como funciona este modelo?
        </h2>
        <p style={{
          fontSize: 16, color: '#78716C', lineHeight: 1.7, margin: '0 0 28px',
        }}>
          Combinamos encuestas reales de 5 casas encuestadoras peruanas con datos de
          Polymarket — un mercado donde la gente apuesta dinero real sobre quien va a ganar.
          Luego simulamos la eleccion 10,000 veces para calcular las probabilidades. Asi de simple.
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
            Asi calcula el modelo, paso a paso
          </h3>
        </div>

        <StepRow
          number={1}
          title="Recopilamos las encuestas"
          description="Tomamos las encuestas mas recientes de IEP, Datum, Ipsos, CPI y CIT. Cada una pregunto a mas de 1,200 personas en todo el Peru — urbano y rural — por quien votarian."
        />
        <StepRow
          number={2}
          title="Les damos peso segun su historial"
          description="No todas las encuestadoras aciertan igual. IEP fue la que mejor predijo las elecciones de 2021 (capto el crecimiento de Castillo), asi que le damos mas peso. CIT tiene menos historial, asi que pesa menos. Las encuestas mas recientes tambien pesan mas que las antiguas."
        />
        <StepRow
          number={3}
          title="Incluimos lo que dice el mercado"
          description="Polymarket es un mercado donde la gente apuesta dinero real sobre quien va a ganar. Hoy tiene mas de $5 millones apostados. Le damos un peso de ~28% al mercado y ~72% a las encuestas. Cuando empiece la veda electoral (5 de abril), el peso del mercado sube porque ya no habra encuestas nuevas."
        />
        <StepRow
          number={4}
          title="Simulamos 10,000 elecciones"
          description="Aqui es donde entra la magia estadistica. Corremos la eleccion 10,000 veces, cada vez con pequenas variaciones aleatorias: que pasa si las encuestas se equivocaron un poco, que pasa si un candidato sube o baja de repente, que pasa si hay una sorpresa como la de Castillo en 2021. De esas 10,000 simulaciones sale la probabilidad de cada candidato."
        />
        <StepRow
          number={5}
          title="Simulamos la segunda vuelta"
          description="Para las simulaciones donde ningun candidato supera el 50%, tomamos a los dos primeros y simulamos la segunda vuelta. Aqui importa mucho el rechazo: si un candidato le cae mal al 63% de la poblacion (como Keiko), muchos de esos votos se van al voto blanco en vez de transferirse. Por eso nuestro modelo predice un voto blanco alto (~40%) en un escenario Aliaga vs Keiko."
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
            description="En el 35% de las simulaciones incluimos shocks: un candidato que colapsa, otro que sube de repente, un escandalo. Peru nos enseno que las sorpresas son la norma, no la excepcion."
          />
          <FeatureCard
            icon={Eye}
            iconColor="#1D4ED8"
            title="Transparencia total"
            description="No escondemos nada. Mostramos los rangos de incertidumbre, el peso de cada encuestadora, y explicamos por que nuestros numeros difieren de Polymarket. Si estamos equivocados, queremos que sepas por que."
          />
          <FeatureCard
            icon={Shield}
            iconColor="#059669"
            title="Datos reales, no opiniones"
            description="Todo numero que ves viene de encuestas publicadas o de apuestas reales. No inventamos datos, no ajustamos a mano, no tenemos favoritos. El modelo corre solo cada 30 minutos."
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

        <LimitationItem text="Predecir escandalos o retiradas de candidatos que aun no han ocurrido. Si manana un candidato se retira, el modelo no lo sabe hasta que Polymarket reaccione." />
        <LimitationItem text="Eliminar el margen de error de las encuestas (+/-2.2 a +/-2.8 puntos). Lo que hacemos es incluir esa incertidumbre explicitamente en los rangos." />
        <LimitationItem text="Capturar al 100% el voto rural o el voto oculto. IEP es la encuestadora que mejor lo hace, por eso le damos mas peso, pero ninguna encuesta es perfecta." />
        <LimitationItem text="Garantizar que Polymarket refleje la realidad peruana. Los traders son mayoritariamente internacionales y pueden no entender los matices locales." />
      </div>

      {/* SECTION 5: Fuentes */}
      <div style={{
        background: '#FFFFFF', border: '1px solid #E5E0D8',
        borderRadius: 12, padding: '24px 28px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <BookOpen size={20} color="#1D4ED8" />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1C1917', margin: 0 }}>
            De donde vienen los datos
          </h3>
        </div>

        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          {/* Encuestas */}
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{
              fontSize: 13, fontWeight: 700, color: '#1C1917',
              textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
            }}>
              Encuestas
            </div>
            {[
              { name: 'IEP', via: 'La Republica' },
              { name: 'Datum', via: 'El Comercio / Cuarto Poder' },
              { name: 'Ipsos', via: 'Peru21' },
              { name: 'CPI', via: 'RPP Noticias' },
              { name: 'CIT', via: 'Centro de Investigaciones Tecnologicas' },
            ].map((s, i) => (
              <div key={i} style={{ fontSize: 13, lineHeight: 2 }}>
                <span style={{ fontWeight: 600, color: '#1C1917' }}>{s.name}</span>
                <span style={{ color: '#A8A29E' }}> — via {s.via}</span>
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
              { name: 'Polymarket', detail: 'polymarket.com ($5.3M en volumen)' },
              { name: 'ONPE', detail: 'Resultados oficiales 2021' },
              { name: 'Wikipedia', detail: 'Tracker de encuestas 2026' },
            ].map((s, i) => (
              <div key={i} style={{ fontSize: 13, lineHeight: 2 }}>
                <span style={{ fontWeight: 600, color: '#1C1917' }}>{s.name}</span>
                <span style={{ color: '#A8A29E' }}> — {s.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 6: Footer credit */}
      <div style={{
        textAlign: 'center', fontSize: 12, color: '#A8A29E', marginTop: 0,
      }}>
        Modelo v2.0 — Alonso + Claude — Abril 2026
      </div>
    </div>
  );
}
