export const USECASES = [
  { id: 'chat',     name: 'Chat',       ctx: 8192,   desc: '8K — normal conversation' },
  { id: 'docs',     name: 'Long docs',  ctx: 32768,  desc: '32K — long PDFs, RAG' },
  { id: 'codebase', name: 'Codebase',   ctx: 131072, desc: '128K — entire projects' },
  { id: 'max',      name: 'Max',        ctx: 262144, desc: '256K — agentic workflows' },
];
