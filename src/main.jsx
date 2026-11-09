import React, { useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as pdfjs from 'pdfjs-dist';
import './style.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

const sampleOffer = `Buscamos una persona para el puesto de Product Manager que lidere el ciclo de vida de nuestros productos digitales. Trabajarás con equipos de diseño, ingeniería y negocio para descubrir oportunidades, priorizar el roadmap y lanzar soluciones de alto impacto.\n\nRequisitos: 4+ años de experiencia en gestión de producto, experiencia con metodologías ágiles y Scrum, análisis de datos con SQL y métricas de producto, investigación de usuarios, experimentación A/B, comunicación con stakeholders, liderazgo y capacidad para trabajar en equipos multidisciplinarios. Se valora experiencia en SaaS, Figma y herramientas de analítica.`;
const sampleCv = `María Torres | Product Manager\n\nProduct Manager con 5 años de experiencia creando productos digitales B2B y SaaS. Lideré equipos multidisciplinarios de diseño e ingeniería en ciclos ágiles, desde discovery e investigación de usuarios hasta el lanzamiento.\n\nExperiencia en gestión de producto, definición de roadmap, priorización, Scrum, SQL, análisis de datos, métricas de producto y experimentación A/B. Colaboración cercana con stakeholders de negocio. Reduje el tiempo de onboarding un 32% y aumenté la activación un 18%.\n\nHerramientas: Figma, Amplitude, Jira. Inglés avanzado.`;

const skillGroups = [
  { label: 'Gestión de producto', terms: ['gestión de producto', 'product management', 'product manager', 'roadmap', 'priorización', 'ciclo de vida del producto'] },
  { label: 'Metodologías ágiles', terms: ['ágil', 'agile', 'scrum', 'kanban', 'sprint'] },
  { label: 'SQL y análisis de datos', terms: ['sql', 'análisis de datos', 'analítica', 'data analysis', 'métricas', 'metricas'] },
  { label: 'Investigación de usuarios', terms: ['investigación de usuarios', 'investigacion de usuarios', 'user research', 'discovery', 'entrevistas', 'usabilidad'] },
  { label: 'Experimentación A/B', terms: ['a/b', 'ab testing', 'experimentación', 'experimentacion', 'experimentos'] },
  { label: 'Comunicación con stakeholders', terms: ['stakeholders', 'partes interesadas', 'comunicación', 'comunicacion'] },
  { label: 'Liderazgo de equipos', terms: ['liderazgo', 'liderar', 'leadership', 'multidisciplinarios', 'multidisciplinario', 'equipos'] },
  { label: 'SaaS', terms: ['saas', 'b2b'] },
  { label: 'Figma', terms: ['figma'] },
];

const normalize = (value) => value.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function analyze(cv, offer) {
  const normalizedCv = normalize(cv);
  const normalizedOffer = normalize(offer);
  const scored = skillGroups.map((group) => {
    const inOffer = group.terms.some((term) => normalizedOffer.includes(normalize(term)));
    const inCv = group.terms.some((term) => normalizedCv.includes(normalize(term)));
    return { ...group, inOffer, inCv };
  }).filter((group) => group.inOffer);
  const matched = scored.filter((group) => group.inCv);
  const missing = scored.filter((group) => !group.inCv);
  return { scored, matched, missing, score: scored.length ? Math.round((matched.length / scored.length) * 100) : 0 };
}

function Icon({ name, size = 20 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Z"/><path d="m19 14 1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14Z"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/></>,
    briefcase: <><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18m-11 0v2h4v-2"/></>,
    upload: <><path d="M12 16V4m-4 4 4-4 4 4"/><path d="M20 16v4H4v-4"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6"/></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9a7 7 0 0 1 11.6-2.6L20 12M4 12l2.8 5.6A7 7 0 0 0 18.4 15"/></>,
    close: <path d="m18 6-12 12M6 6l12 12"/>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function App() {
  const [cv, setCv] = useState('');
  const [offer, setOffer] = useState('');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);
  const report = useMemo(() => result ? analyze(result.cv, result.offer) : null, [result]);

  async function readFile(file) {
    if (!file) return;
    setError('');
    try {
      let text;
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
        const pages = await Promise.all(Array.from({ length: pdf.numPages }, async (_, index) => {
          const page = await pdf.getPage(index + 1);
          const content = await page.getTextContent();
          return content.items.map((item) => item.str).join(' ');
        }));
        text = pages.join('\n');
      } else if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
        text = await file.text();
      } else {
        throw new Error('Elige un archivo PDF o TXT.');
      }
      if (!text.trim()) throw new Error('No encontramos texto en el archivo. Prueba con un PDF con texto seleccionable o pega el contenido.');
      setCv(text);
      setFileName(file.name);
      setResult(null);
    } catch (e) { setError(e.message || 'No pudimos leer el archivo.'); }
  }

  function compare() {
    if (cv.trim().length < 40 || offer.trim().length < 40) {
      setError('Añade al menos 40 caracteres en cada campo para obtener una comparación útil.');
      return;
    }
    setError(''); setLoading(true); setResult(null);
    window.setTimeout(() => { setResult({ cv, offer }); setLoading(false); document.getElementById('resultados')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 450);
  }

  function loadExample() { setCv(sampleCv); setOffer(sampleOffer); setFileName(''); setError(''); setResult(null); }
  function reset() { setCv(''); setOffer(''); setFileName(''); setError(''); setResult(null); if (fileRef.current) fileRef.current.value = ''; window.scrollTo({ top: 0, behavior: 'smooth' }); }

  const advice = report?.score >= 75 ? 'Tu perfil tiene una buena base para esta oportunidad. Refuerza tus logros con resultados medibles y adapta el resumen profesional al puesto.' : report?.score >= 45 ? 'Hay una conexión interesante. Añade ejemplos concretos de las habilidades que ya tienes y destaca su impacto en tus últimos proyectos.' : 'Esta oferta pide varias habilidades que no aparecen en tu CV. Revisa si tienes experiencia relacionada que puedas describir con más precisión.';

  return <>
    <header className="topbar"><a className="brand" href="#inicio" aria-label="ResumeMatch, inicio"><span className="brand-icon"><Icon name="spark" size={19}/></span><span>resume<span className="brand-accent">match</span></span></a><div className="topbar-right"><span className="privacy"><Icon name="lock" size={15}/> Análisis privado</span><a className="nav-link" href="#como-funciona">Cómo funciona</a></div></header>
    <main id="inicio">
      <section className="hero"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot"/> TU PRÓXIMO PASO PROFESIONAL</div><h1>Tu experiencia merece<br/>la <span>oportunidad correcta.</span></h1><p className="hero-sub">Compara tu CV con una oferta laboral y descubre qué tan cerca estás, qué destacar y cómo dar el siguiente paso.</p><div className="hero-points"><div><span className="point-icon"><Icon name="check" size={15}/></span>Resultados en segundos</div><div><span className="point-icon"><Icon name="check" size={15}/></span>Sin registros ni complicaciones</div></div></div><div className="hero-visual" aria-hidden="true"><div className="visual-orbit orbit-one"/><div className="visual-orbit orbit-two"/><div className="visual-card card-back"><span className="mini-line wide"/><span className="mini-line"/><span className="mini-line short"/><div className="mini-bars"><i/><i/><i/><i/><i/></div></div><div className="visual-card card-front"><div className="visual-file"><Icon name="file" size={22}/></div><div className="visual-card-label">COMPATIBILIDAD</div><div className="visual-score">86<span>%</span></div><div className="visual-progress"><i/></div><div className="visual-match"><span><Icon name="check" size={13}/></span> Perfil con potencial</div></div><div className="float-star">✳</div><div className="float-dot dot-a"/><div className="float-dot dot-b"/></div></section>
      <section className="workspace" aria-label="Comparador de CV y oferta laboral"><div className="section-heading"><div><div className="eyebrow muted">EMPIEZA AQUÍ</div><h2>Dos piezas. Una gran oportunidad.</h2></div><button className="example-button" type="button" onClick={loadExample}><Icon name="spark" size={16}/> Probar con un ejemplo</button></div>
        <div className="input-grid"><article className="input-card"><div className="input-card-head"><div className="input-title"><span className="input-icon lavender"><Icon name="file" size={19}/></span><div><h3>Tu currículum</h3><p>Cuéntanos qué sabes hacer</p></div></div><span className="step-label">01</span></div><textarea aria-label="Texto del currículum" value={cv} onChange={(e) => { setCv(e.target.value); setFileName(''); setResult(null); }} placeholder="Pega aquí el texto de tu CV: experiencia, habilidades, formación..."/><div className="input-footer"><span className="char-count">{cv.length ? `${cv.length.toLocaleString('es')} caracteres` : 'Tu información se procesa de forma privada'}</span><button type="button" className="upload-button" onClick={() => fileRef.current?.click()}><Icon name="upload" size={16}/>{fileName || 'Subir CV'}<input ref={fileRef} type="file" accept=".pdf,.txt,application/pdf,text/plain" onChange={(e) => readFile(e.target.files?.[0])} hidden/></button></div></article>
          <article className="input-card"><div className="input-card-head"><div className="input-title"><span className="input-icon peach"><Icon name="briefcase" size={19}/></span><div><h3>La oferta laboral</h3><p>El puesto que te interesa</p></div></div><span className="step-label">02</span></div><textarea aria-label="Texto de la oferta laboral" value={offer} onChange={(e) => { setOffer(e.target.value); setResult(null); }} placeholder="Pega aquí la descripción del puesto, sus requisitos y responsabilidades..."/><div className="input-footer"><span className="char-count">{offer.length ? `${offer.length.toLocaleString('es')} caracteres` : 'Cualquier oferta funciona'}</span><span className="paste-hint"><Icon name="check" size={14}/> Se analiza en tu dispositivo</span></div></article></div>
        {error && <div className="error-message" role="alert"><span>!</span>{error}</div>}
        <div className="action-row"><button className="compare-button" type="button" onClick={compare} disabled={loading}>{loading ? <><span className="spinner"/> Analizando tu perfil…</> : <>Comparar mi perfil <Icon name="arrow" size={18}/></>}</button><span className="action-note"><Icon name="lock" size={14}/> Tu CV no se guarda ni se comparte</span></div>
      </section>
      {report && <section id="resultados" className="results" aria-live="polite"><div className="results-top"><div><div className="eyebrow muted">TU ANÁLISIS</div><h2>Esto es lo que encontramos.</h2></div><button className="reset-button" type="button" onClick={reset}><Icon name="refresh" size={16}/> Nueva comparación</button></div><div className="results-grid"><article className="score-card"><div className="score-top"><span>COMPATIBILIDAD GENERAL</span><span className="score-status"><i/> {report.score >= 75 ? 'Buen encaje' : report.score >= 45 ? 'Encaje posible' : 'Puedes reforzarlo'}</span></div><div className="score-number">{report.score}<span>%</span></div><div className="score-track"><i style={{ width: `${report.score}%` }}/></div><p className="score-caption">{report.matched.length} de {report.scored.length} habilidades clave encontradas</p><div className="score-foot"><span><Icon name="clock" size={15}/> Análisis instantáneo</span><span><Icon name="lock" size={14}/> Solo en este dispositivo</span></div></article><article className="skills-card"><div className="skills-heading"><div><span className="skills-kicker">EL DETALLE</span><h3>Habilidades clave</h3></div><span className="skills-total">{report.scored.length} identificadas</span></div>{report.scored.length ? <div className="skill-list">{report.scored.map((skill) => <div className="skill-row" key={skill.label}><span className={`skill-check ${skill.inCv ? 'found' : 'not-found'}`}><Icon name={skill.inCv ? 'check' : 'close'} size={13}/></span><span>{skill.label}</span><span className={`skill-tag ${skill.inCv ? 'tag-found' : 'tag-missing'}`}>{skill.inCv ? 'En tu CV' : 'Por destacar'}</span></div>)}</div> : <p className="empty-skills">No detectamos habilidades frecuentes. Prueba con una oferta más detallada.</p>}</article></div><article className="advice-card"><span className="advice-icon"><Icon name="spark" size={18}/></span><div><span className="skills-kicker">UN SIGUIENTE PASO</span><p>{advice}</p></div></article><p className="disclaimer">Esta comparación es orientativa y se basa en las habilidades mencionadas en los textos. No representa una decisión de contratación.</p></section>}
      <section className="how-section" id="como-funciona"><div className="how-intro"><div className="eyebrow muted">SENCILLO Y TRANSPARENTE</div><h2>Un poco más de claridad<br/>para tu siguiente paso.</h2><p>Prepárate mejor para postular con una lectura clara de lo que la oferta busca y de lo que tu perfil ya cuenta.</p></div><div className="how-steps"><div className="how-step"><span className="step-number">1</span><div><h3>Comparte los textos</h3><p>Pega tu CV y la descripción del puesto que te interesa.</p></div></div><div className="how-step"><span className="step-number">2</span><div><h3>Compara las habilidades</h3><p>Revisamos las habilidades que aparecen en ambos textos.</p></div></div><div className="how-step"><span className="step-number">3</span><div><h3>Decide qué destacar</h3><p>Usa el resultado como guía para adaptar tu postulación.</p></div></div></div></section>
    </main><footer><a className="brand footer-brand" href="#inicio"><span className="brand-icon"><Icon name="spark" size={17}/></span><span>resume<span className="brand-accent">match</span></span></a><span>Hecho para que tu experiencia encuentre su lugar.</span><span>© 2026 ResumeMatch</span></footer>
  </>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
