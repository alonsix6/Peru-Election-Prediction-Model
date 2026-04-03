function GlossaryCard({ term, definition }) {
  return (
    <div style={{
      background: '#1E293B', borderLeft: '3px solid #38BDF8', borderRadius: '0 8px 8px 0',
      padding: '12px 16px', marginBottom: 8
    }}>
      <div style={{ color: '#F1F5F9', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{term}</div>
      <div style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.6 }}>{definition}</div>
    </div>
  );
}

function NumberBadge({ n }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 28, height: 28, borderRadius: '50%', background: '#0C4A6E',
      color: '#38BDF8', fontWeight: 700, fontSize: 13, flexShrink: 0
    }}>{n}</span>
  );
}

function LimitationCard({ text }) {
  return (
    <div style={{
      background: '#1E293B', borderLeft: '3px solid #F59E0B', borderRadius: '0 8px 8px 0',
      padding: '12px 16px', marginBottom: 8
    }}>
      <div style={{ color: '#CBD5E1', fontSize: 13, lineHeight: 1.6 }}>{text}</div>
    </div>
  );
}

export default function MetodologiaTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 720 }}>
      {/* Intro */}
      <div>
        <h2 style={{ color: '#F1F5F9', fontSize: 20, fontWeight: 700, margin: '0 0 12px' }}>
          ¿Qué es este modelo?
        </h2>
        <p style={{ color: '#CBD5E1', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
          Este es un modelo estadístico que agrega 16 encuestas de 5 casas encuestadoras peruanas,
          las combina con datos del mercado de predicciones Polymarket ($5.1 millones en apuestas reales),
          y corre 10,000 simulaciones para estimar quién tiene más probabilidades de ganar
          la primera vuelta presidencial del 12 de abril de 2026 y la eventual segunda vuelta del 7 de junio.
        </p>
      </div>

      {/* Glossary */}
      <div>
        <h3 style={{ color: '#F1F5F9', fontSize: 17, fontWeight: 600, margin: '0 0 12px' }}>Glosario</h3>
        <GlossaryCard
          term="% en primera vuelta"
          definition="El porcentaje de votos que esperamos que obtenga cada candidato el 12 de abril. Es un promedio ponderado de todas las encuestas, ajustado por sesgos conocidos de cada encuestadora."
        />
        <GlossaryCard
          term="IC 90% (Intervalo de confianza)"
          definition="En 9 de cada 10 simulaciones, el resultado cae dentro de este rango. Ejemplo: Aliaga 20.7% [17.4–24.3] significa que lo más probable es ~21%, pero podría estar entre 17% y 24%."
        />
        <GlossaryCard
          term="P(2da vuelta)"
          definition="Probabilidad de quedar entre los dos primeros y pasar a segunda vuelta. Un candidato con P(2da)=88% pasa en 8,800 de las 10,000 simulaciones."
        />
        <GlossaryCard
          term="P(Ganar)"
          definition="Probabilidad de ganar la presidencia, considerando tanto la primera como la segunda vuelta. Incluye la simulación de transferencia de votos y rechazo definitivo del electorado."
        />
        <GlossaryCard
          term="Monte Carlo"
          definition='Corremos la elección 10,000 veces con variaciones aleatorias realistas (margen de error, sesgos entre encuestadoras, posibles sorpresas). Contamos cuántas veces gana cada candidato. Más simulaciones = resultado más estable.'
        />
        <GlossaryCard
          term="α Polymarket"
          definition="El peso que le damos al mercado de predicciones vs las encuestas. Empieza en ~28% y sube al 85% el día de la elección, porque durante la veda electoral (5–12 abril) las encuestas ya no se publican pero Polymarket sigue absorbiendo información fresca."
        />
      </div>

      {/* Why trust */}
      <div>
        <h3 style={{ color: '#F1F5F9', fontSize: 17, fontWeight: 600, margin: '0 0 12px' }}>¿Por qué creerle?</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            '16 encuestas de 5 casas encuestadoras independientes (IEP, Datum, Ipsos, CPI, CIT)',
            'Pesos de encuestadoras basados en su precisión real en las elecciones de 2021',
            '10,000 simulaciones Monte Carlo con errores correlacionados entre encuestadoras',
            '$5.1 millones en apuestas reales de Polymarket integradas con peso dinámico',
            'Mostramos rangos de incertidumbre (IC 90%), no números exactos — la honestidad es parte del modelo',
          ].map((text, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <NumberBadge n={i + 1} />
              <span style={{ color: '#CBD5E1', fontSize: 13, lineHeight: 1.6, paddingTop: 4 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Limitations */}
      <div>
        <h3 style={{ color: '#F1F5F9', fontSize: 17, fontWeight: 600, margin: '0 0 12px' }}>Limitaciones honestas</h3>
        <LimitationCard text="Las encuestas tienen un margen de error de ±2.2 a ±2.8 puntos. Nuestro modelo no elimina esa incertidumbre — la incorpora explícitamente." />
        <LimitationCard text="No predecimos eventos imprevistos: escándalos, retiradas de candidatos, crisis políticas. Esos escenarios están parcialmente capturados por Polymarket." />
        <LimitationCard text="Existe el riesgo de un candidato emergente invisible a las encuestas, como ocurrió con Castillo en 2021. Mitigamos esto con shocks estocásticos en el 5% de las simulaciones." />
        <LimitationCard text="Los traders de Polymarket son mayoritariamente internacionales y pueden no capturar matices del electorado peruano, especialmente rural." />
      </div>

      {/* Sources */}
      <div>
        <h3 style={{ color: '#F1F5F9', fontSize: 17, fontWeight: 600, margin: '0 0 12px' }}>Fuentes</h3>
        <div style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.8 }}>
          <div>CPI — cpi.pe (via RPP Noticias)</div>
          <div>Ipsos — ipsos.com/es-pe (via Perú21)</div>
          <div>Datum — datum.com.pe (via El Comercio / Cuarto Poder)</div>
          <div>IEP — iep.org.pe (via La República)</div>
          <div>CIT — Centro de Investigaciones Tecnológicas</div>
          <div>Polymarket — polymarket.com ($5.1M en volumen)</div>
          <div>ONPE — onpe.gob.pe (resultados oficiales 2021)</div>
        </div>
        <p style={{ color: '#64748B', fontSize: 11, marginTop: 12, fontStyle: 'italic' }}>
          Modelo v2.0 — Alonso + Claude — 2 abril 2026
        </p>
      </div>
    </div>
  );
}
