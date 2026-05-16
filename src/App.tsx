import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Search, Building2, Briefcase, Zap, AlertCircle, RefreshCw, FileText, Database, UploadCloud } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';
import Papa from 'papaparse';

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function App() {
  const [mode, setMode] = useState<'architect' | 'orchestrator'>('architect');
  
  // Architect State
  const [empresa, setEmpresa] = useState('');
  const [industria, setIndustria] = useState('');
  
  // Orchestrator State
  const [csvData, setCsvData] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Common State
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [searchLinks, setSearchLinks] = useState<{ uri: string; title: string }[]>([]);

  // Load sample CSV on mount
  useEffect(() => {
    fetch('/data.csv')
      .then(res => res.text())
      .then(text => {
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            setCsvData(results.data);
          }
        });
      })
      .catch(err => console.error("Could not load sample CSV", err));
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvData(results.data);
        setSelectedAccount('');
      }
    });
  };

  const handleGenerateArchitect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresa.trim() || !industria.trim()) {
      setError('Por favor completa ambos campos.');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');
    setSearchLinks([]);

    try {
      const prompt = `Actúa como un "Consultor AI Architect 2026", un Senior AI Solution Architect de Xertica.
Tu misión es transformar el nombre de una empresa y su industria en una estrategia de transformación digital tangible utilizando la metodología X-Factor (Enable, Optimize, Transform) y el ecosistema de AI Superpowers de Google.

Eres el representante de 4 "Gemas" de inteligencia:
1. GEMA 1: ESTRATEGA (Investigación de mercado, tendencias, dónde ganar).
2. GEMA 2: TÁCTICA (Planes de acción, roadmaps, KPIs).
3. GEMA 3: CREATIVA (Conceptos disruptivos, storytelling).
4. GEMA 4: OPERATIVA (Gestión operativa).
Integrarás los flujos de estas 4 gemas para crear una propuesta cohesiva.

Empresa: ${empresa}
Industria: ${industria}

Instrucciones de Razonamiento:
1. Investigación: Usa búsqueda en tiempo real (Google Search) para identificar la misión de esta empresa, sus servicios principales y posibles desafíos operativos actuales. Busca noticias recientes de ${empresa} para personalizar el roadmap con datos reales.
2. Detección de Fricción: Identifica dónde "le duele" la operación (ej. procesos manuales, silos de datos, atención al cliente lenta).
3. Estrategia Storytelling: Diseña una narrativa titulada "El Recorrido de [Activo Principal]".
4. Mapeo de Herramientas: Asigna NotebookLM, AppSheet y Gemini Live API a puntos específicos de esa historia para resolver las fricciones.

Formato de salida obligatorio:

## Ficha de Identidad
**${empresa} | ${industria}**
[Insights de Búsqueda y noticias recientes] (Marca datos no verificados como [Unconfirmed])

## La Historia (Storytelling): El Recorrido de [Activo Principal]
[Narrativa emocional y profesional que conecte la IA con el core del negocio]

## Roadmap de Demos (MVP 21 días)
- **NotebookLM (El Cerebro):** Qué manuales cargaremos.
- **AppSheet (La Acción):** Qué proceso de campo digitalizaremos.
- **Gemini Enterprise (Los Insights):** Qué decisiones ayudará a tomar en Sheets/Docs.
- **Gemini Live API (La Voz/Interacción):** Cómo hablará el cliente con la empresa.

## Cierre Estratégico
[Un pitch de 3 líneas super contundente para el C-Level]

Tono y Estilo:
Consultivo, inspirador y altamente profesional. Evita generalidades, sé extremadamente específico sobre la empresa investigada.`;

      const response = await ai.models.generateContent({
        model: 'Gemini Flash-Lite Latest',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      setResult(response.text || '');

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        const links = chunks
          .filter((c: any) => c.web && c.web.uri && c.web.title)
          .map((c: any) => ({ uri: c.web.uri, title: c.web.title }));
        const uniqueLinks = Array.from(new Map(links.map((link) => [link.uri, link])).values());
        setSearchLinks(uniqueLinks as any);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocurrió un error al generar la estrategia.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateOrchestrator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) {
      setError('Por favor selecciona una cuenta del listado.');
      return;
    }
    
    setLoading(true);
    setError('');
    setResult('');
    setSearchLinks([]);

    try {
      const accountData = csvData.find((row) => row['CUENTA'] === selectedAccount || row['Cuenta SF'] === selectedAccount);
      
      const prompt = `SECTION 1: SYSTEM / ROLE PROMPT
Role: Eres el GWS Data Orchestrator & Account Intelligence Sync. Expertise: Especialista en análisis de bases de datos relacionales (Google Sheets/BigQuery) y modelado de datos para inteligencia comercial. Mission: Tu función es actuar como el puente entre la data cruda de las cuentas (Sheets) y las 4 Gemas existentes, transformando filas de Excel en "insights" tácticos para el Account Plan.

SECTION 2: DATOS DE LA CUENTA (Extraídos del CSV Upload):
${JSON.stringify(accountData, null, 2)}

SECTION 3: REASONING & OUTPUT INSTRUCTIONS
- Mapear variables: Clasifica industria, tamaño, dolores detectados y estado de facturación basándote en los datos.
- Cruzar referencias: Si la cuenta es del sector "Retail" o similar, activa aceleradores como "Análisis de Video" o "Forecasting". Usa datos como Renovación (Q2-2026?) para urgencia.
- Detectar Gaps: Identifica qué información falta en estos datos (ej. Casos de uso) para marcarla como "Unconfirmed".
- Restricciones: Queda estrictamente prohibido inventar nombres de decisores o montos de facturación que no estén en la data. Si un dato es una suposición basada en la industria, marcar como [ASSUMPTION].

SECTION 4: OUTPUT FORMAT (The Unified Sync)
Presentarás la respuesta con la siguiente estructura exacta:

## Resumen Ejecutivo de la Cuenta:
(Data cruda procesada y analizada)

## Input para Gema 1 (Estratega):
(Tendencias específicas según la industria del Sheets)

## Input para Gema 2 (Táctica):
(Roadmap técnico basado en el stack tecnológico actual / viable para upgrade)

## Input para Gema 3 (Creativa):
(Concepto de evento C-Level alineado al "dolor" principal extraído o supuesto)

## Riesgos Detectados:
(Ej. Bajo uso de licencias basado en adopción, "Salud de la cuenta", o alertas rojas/Semaforo detectadas)`;

      const response = await ai.models.generateContent({
        model: 'Gemini Flash-Lite Latest',
        contents: prompt,
      });

      setResult(response.text || '');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocurrió un error al orquestar los datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-gray-200 font-sans flex flex-col overflow-x-hidden">
      <header className="border-b border-gray-800 py-6 mb-8 mt-2">
        <div className="max-w-[1024px] mx-auto px-4 sm:px-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white tracking-tighter">&gt;<span className="-ml-1">X</span></span>
                <span className="text-2xl font-bold tracking-tight text-white">ertica.ai</span>
              </div>
              <h1 className="text-[10px] font-black tracking-[0.2em] uppercase bg-gradient-to-r from-fuchsia-500 to-cyan-400 bg-clip-text text-transparent mt-0.5">
                AI Superpowers
              </h1>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase font-medium">Active Agent</p>
              <p className="text-sm font-semibold text-blue-100">{mode === 'architect' ? 'AI Solution Architect' : 'Data Orchestrator'}</p>
            </div>
            <div className="h-10 w-px bg-gray-800"></div>
            <div className="flex bg-[#14161B] p-1 rounded-lg border border-gray-800">
              <button 
                onClick={() => { setMode('architect'); setResult(''); setError(''); }}
                className={"px-3 py-1.5 text-xs font-semibold rounded-md transition-colors " + (mode === 'architect' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-gray-300')}
              >
                1. Architect Mode
              </button>
              <button 
                onClick={() => { setMode('orchestrator'); setResult(''); setError(''); }}
                className={"px-3 py-1.5 text-xs font-semibold rounded-md transition-colors " + (mode === 'orchestrator' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-gray-300')}
              >
                2. Data Orchestrator
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1024px] mx-auto px-4 sm:px-8 pb-12 flex-1 w-full">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Sidebar */}
          <div className="md:col-span-4 flex flex-col gap-6">
            <div className="bg-[#14161B] rounded-2xl p-6 border border-gray-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-900/20 p-2 rounded-lg text-blue-400 border border-blue-500/20">
                  {mode === 'architect' ? <Bot size={20} /> : <Database size={20} />}
                </div>
                <div>
                  <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    {mode === 'architect' ? 'Nueva Estrategia' : 'Account Sync'}
                  </h2>
                </div>
              </div>

              {mode === 'architect' ? (
                <form onSubmit={handleGenerateArchitect} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="empresa" className="text-sm font-medium text-gray-400 block">
                      Nombre de la Empresa
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                        <Building2 size={16} />
                      </div>
                      <input
                        id="empresa"
                        type="text"
                        className="w-full pl-10 pr-4 py-2 bg-[#0A0B0D] border border-gray-800 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm outline-none transition-shadow text-white placeholder-gray-600"
                        placeholder="Ej. Pycca"
                        value={empresa}
                        onChange={(e) => setEmpresa(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="industria" className="text-sm font-medium text-gray-400 block">
                      Industria
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                        <Briefcase size={16} />
                      </div>
                      <input
                        id="industria"
                        type="text"
                        className="w-full pl-10 pr-4 py-2 bg-[#0A0B0D] border border-gray-800 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm outline-none transition-shadow text-white placeholder-gray-600"
                        placeholder="Ej. Retail / Logística"
                        value={industria}
                        onChange={(e) => setIndustria(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white text-black font-bold text-sm rounded-lg hover:bg-gray-200 uppercase tracking-widest transition-colors shadow-lg shadow-white/5 mt-6 disabled:bg-gray-700 disabled:text-gray-400 disabled:shadow-none"
                  >
                    {loading ? (
                      <><RefreshCw size={16} className="animate-spin" /> Generando...</>
                    ) : (
                      <><Search size={16} /> Arquitectar Solución</>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleGenerateOrchestrator} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400 flex items-center justify-between">
                      <span>Dataset Origen (CSV)</span>
                      <span className="text-xs text-gray-600 font-mono">{csvData.length} records</span>
                    </label>
                    
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-[#0A0B0D] border border-gray-800 border-dashed rounded-lg text-sm text-gray-400 hover:text-white transition-colors hover:border-gray-600"
                    >
                      <UploadCloud size={16} /> Subir nuevo Sheets (CSV)
                    </button>
                    <input 
                      type="file" 
                      accept=".csv"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden" 
                    />
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label htmlFor="account" className="text-sm font-medium text-gray-400 block">
                      Seleccionar Cuenta (Sincronización)
                    </label>
                    <div className="relative">
                      <select
                        id="account"
                        className="w-full pl-3 pr-8 py-2 bg-[#0A0B0D] border border-gray-800 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm outline-none transition-shadow text-white cursor-pointer appearance-none"
                        value={selectedAccount}
                        onChange={(e) => setSelectedAccount(e.target.value)}
                        disabled={csvData.length === 0}
                      >
                        <option value="" className="text-gray-500">-- Seleccione una cuenta --</option>
                        {csvData.map((row, i) => {
                          const cuentaName = row['CUENTA'] || row['Cuenta SF'] || ('Row ' + i);
                          return cuentaName && cuentaName !== ('Row ' + i) ? <option key={i} value={cuentaName}>{cuentaName}</option> : null;
                        })}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-gray-500">
                        <Database size={16} />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !selectedAccount || csvData.length === 0}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white text-black font-bold text-sm rounded-lg hover:bg-gray-200 uppercase tracking-widest transition-colors shadow-lg shadow-white/5 mt-6 disabled:bg-gray-700 disabled:text-gray-400 disabled:shadow-none"
                  >
                    {loading ? (
                      <><RefreshCw size={16} className="animate-spin" /> Sincronizando...</>
                    ) : (
                      <><Zap size={16} /> Ejecutar Sync de Cuenta</>
                    )}
                  </button>
                </form>
              )}

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-900/20 text-red-400 border border-red-900/50 rounded-lg text-xs mt-4">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}
            </div>

            {/* Gems info box */}
            <div className="flex-1 bg-gradient-to-b from-[#14161B] to-transparent rounded-2xl p-6 border border-gray-800 flex flex-col justify-end">
              <h2 className="text-xs font-bold text-gray-500 uppercase mb-4 tracking-widest">
                {mode === 'architect' ? 'Twin Systems' : 'Estado GWS Data Orchestrator'}
              </h2>
              <ul className="space-y-3">
                {mode === 'architect' ? (
                  <>
                    <li className="flex gap-2 text-xs"><span className="text-blue-500 font-bold w-16">GEMA 1</span> <span className="text-gray-400">Estratega (Market)</span></li>
                    <li className="flex gap-2 text-xs"><span className="text-blue-500 font-bold w-16">GEMA 2</span> <span className="text-gray-400">Táctica (Planner)</span></li>
                    <li className="flex gap-2 text-xs"><span className="text-blue-500 font-bold w-16">GEMA 3</span> <span className="text-gray-400">Creativa (Storytelling)</span></li>
                    <li className="flex gap-2 text-xs"><span className="text-blue-500 font-bold w-16">GEMA 4</span> <span className="text-gray-400">Operativa (Revenue)</span></li>
                  </>
                ) : (
                  <>
                    <li className="flex gap-2 text-xs"><span className="text-blue-500 font-bold w-16">Data In</span> <span className="text-gray-400">Google Sheets CRM</span></li>
                    <li className="flex gap-2 text-xs"><span className="text-blue-500 font-bold w-16">Sync</span> <span className="text-gray-400">Gemini LLM Processing</span></li>
                    <li className="flex gap-2 text-xs"><span className="text-blue-500 font-bold w-16">Output</span> <span className="text-green-400 truncate">Alimentar 4 Gemas</span></li>
                  </>
                )}
              </ul>
              <div className="mt-6 text-[10px] text-blue-500 font-mono tracking-tighter uppercase border-t border-gray-800/50 pt-4 truncate">
                {mode === 'architect' ? 'Status: [En Espera]' : 'Integración AI: [Verificada]'}
              </div>
            </div>
          </div>

          {/* Results Area */}
          <div className="md:col-span-8 flex flex-col">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="bg-[#14161B] rounded-2xl border border-gray-800 h-full min-h-[500px] flex flex-col items-center justify-center text-center p-8"
                >
                  <RefreshCw size={48} className="animate-spin text-blue-500 mb-6" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    {mode === 'architect' ? 'Sincronizando Gemas...' : 'Extrayendo Insights del Dataset...'}
                  </h3>
                  <p className="text-xs text-gray-500 max-w-sm uppercase tracking-widest">
                    {mode === 'architect' 
                      ? 'Analizando [Market Data] & Construyendo [Storytelling]'
                      : 'Cruzando referencias & Generando The Unified Sync'}
                  </p>
                </motion.div>
              ) : result ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 flex-1"
                >
                  <div className="bg-[#14161B] border border-gray-800 rounded-2xl p-6 md:p-8">
                    <div className="prose prose-invert prose-blue max-w-none prose-headings:font-semibold prose-a:text-blue-400 prose-sm md:prose-base prose-h1:text-xl prose-h2:text-lg prose-h2:border-b prose-h2:border-gray-800 prose-h2:pb-2 prose-h3:text-base prose-strong:text-white">
                      <Markdown>{result}</Markdown>
                    </div>
                  </div>

                  {mode === 'architect' && searchLinks.length > 0 && (
                    <div className="bg-[#14161B] border border-gray-800 rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Fuentes Verificadas (Real-Time Insight)</h2>
                      </div>
                      <ul className="space-y-2 text-sm">
                        {searchLinks.map((link, i) => (
                          <li key={i}>
                            <a href={link.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline inline-flex items-baseline gap-1">
                              {link.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="bg-gradient-to-b from-[#14161B] to-transparent rounded-2xl border border-gray-800 h-full min-h-[500px] flex flex-col items-center justify-center text-center p-8 text-gray-500 gap-4">
                   <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                     {mode === 'architect' ? <Bot size={32} className="text-blue-400" /> : <Database size={32} className="text-blue-400" />}
                   </div>
                   <div>
                    <h3 className="text-sm font-medium text-gray-300">Esperando Parámetros</h3>
                    <p className="mt-1 text-xs">
                      {mode === 'architect' 
                        ? 'Especifica Industria y Empresa para activar la Arquitectura.'
                        : 'Sube un CSV o usa el precargado para Sincronizar un Account Plan.'}
                    </p>
                   </div>
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </main>

      <footer className="border-t border-gray-800 py-4 mt-auto">
        <div className="max-w-[1024px] mx-auto px-4 sm:px-8 flex items-center justify-center text-xs text-gray-500 uppercase tracking-widest gap-2">
          <span>Created with</span>
          <span className="font-black bg-gradient-to-r from-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">AI Superpowers</span>
          <span>by Fabricio Noboa</span>
          <span className="text-sm">🇪🇨</span>
        </div>
      </footer>
    </div>
  );
}
