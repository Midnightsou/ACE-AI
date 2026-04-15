export const tools = [
  {
    id: 'chat',
    name: 'Ace AI',
    description: 'General AI assistant',
    icon: '💬',
    category: 'general',
    path: '/chat',
  },
  {
    id: 'math',
    name: 'Axioma',
    description: 'Solve math problems ',
    icon: '🧮',
    category: 'general',
    path: '/tool/math',
  },
  {
    id: 'codex',
    name: 'Fabricare',
    description: 'write and debug code',
    icon: '🔧',
    category: 'technical',
    path: '/tool/codex',
  },
  {
    id: 'cv-maker',
    name: 'Aeterna',
    description: 'Generate a professional CV',
    icon: '📄',
    category: 'productivity',
    path: '/tool/cv-maker',
  },
  {
    id: 'cv-analyser',
    name: 'Kairos',
    description: 'Rewrite your CV based on the job description ',
    icon: '🔍',
    category: 'productivity',
    path: '/tool/cv-analyser',
  },
  {
    id: 'cover-letter',
    name: 'Peitho',
    description: 'Write tailored cover letters',
    icon: '✉️',
    category: 'productivity',
    path: '/tool/cover-letter',
  },
  {
    id: 'essay-writer',
    name: 'Scribe',
    description: 'Write academic and professional essays',
    icon: '📑',
    category: 'productivity',
    path: '/tool/essay-writer',
  },
  {
    id: 'email-composer',
    name: 'Litterae',
    description: 'Write professional emails fast',
    icon: '📨',
    category: 'productivity',
    path: '/tool/email-composer',
  },
  
  
  
  {
  id: 'dojo',
  name: 'omnis',
  description: 'Learn any topic by chatting, generating summaries, quizzes, and podcasts',
  icon: '🥋',
  category: 'general',
  path: '/tool/dojo',
},
]

export const toolCategories = [
  { id: 'general', label: 'General' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'technical', label: 'Technical' },
  { id: 'creative', label: 'Creative' },
  { id: 'business', label: 'Business' },
]

export function getToolById(id) {
  return tools.find((t) => t.id === id)
}

export function getToolByPath(path) {
  return tools.find((t) => t.path === path)
}

export function getToolsByCategory(category) {
  return tools.filter((t) => t.category === category)
}