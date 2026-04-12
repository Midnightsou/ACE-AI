export const tools = [
  {
    id: 'chat',
    name: 'Chat',
    description: 'General AI assistant',
    icon: '💬',
    category: 'general',
    path: '/chat',
  },
  {
    id: 'math',
    name: 'Math Mode',
    description: 'Solve math problems step by step',
    icon: '🧮',
    category: 'general',
    path: '/tool/math',
  },
  {
    id: 'codex',
    name: 'Codex',
    description: 'Code generation and debugging',
    icon: '💻',
    category: 'technical',
    path: '/tool/codex',
  },
  {
    id: 'cv-maker',
    name: 'CV Maker',
    description: 'Generate a professional CV',
    icon: '📄',
    category: 'productivity',
    path: '/tool/cv-maker',
  },
  {
    id: 'cv-analyser',
    name: 'CV Analyser',
    description: 'Rewrite your CV for any job',
    icon: '🔍',
    category: 'productivity',
    path: '/tool/cv-analyser',
  },
  {
    id: 'cover-letter',
    name: 'Cover Letter',
    description: 'Write tailored cover letters',
    icon: '✉️',
    category: 'productivity',
    path: '/tool/cover-letter',
  },
  {
    id: 'essay-writer',
    name: 'Essay Writer',
    description: 'Write academic and professional essays',
    icon: '📝',
    category: 'productivity',
    path: '/tool/essay-writer',
  },
  {
    id: 'email-composer',
    name: 'Email Composer',
    description: 'Write professional emails fast',
    icon: '📧',
    category: 'productivity',
    path: '/tool/email-composer',
  },
  {
    id: 'image-creator',
    name: 'Image Creator',
    description: 'Generate images from text',
    icon: '🎨',
    category: 'creative',
    path: '/tool/image-creator',
  },
  
  
  {
  id: 'dojo',
  name: 'Dojo Mode',
  description: 'Practice JAMB & WAEC questions, track your readiness',
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