export const tools = [
  { id: 'chat', name: 'Chat', description: 'General AI assistant', category: 'general', path: '/chat' },
  { id: 'Axioma', name: 'Math Mode', description: 'Step-by-step problem solving', category: 'general', path: '/tool/math' },
  { id: 'Fabricare', name: 'Codex', description: 'Code generation and debugging', category: 'technical', path: '/tool/codex' },
  { id: 'Aeterna', name: 'CV Maker', description: 'Generate a professional CV', category: 'productivity', path: '/tool/cv-maker' },
  { id: 'Kairos', name: 'CV Analyser', description: 'Rewrite your CV for any job', category: 'productivity', path: '/tool/cv-analyser' },
  { id: 'Peitho', name: 'Cover Letter', description: 'Write tailored cover letters', category: 'productivity', path: '/tool/cover-letter' },
  { id: 'Scribe', name: 'Essay Writer', description: 'Academic and professional essays', category: 'productivity', path: '/tool/essay-writer' },
  { id: 'Litterae', name: 'Email Composer', description: 'Write professional emails fast', category: 'productivity', path: '/tool/email-composer' },
  { id: 'Omnis', name: 'Dojo', description: 'enter into the om', category: 'general', path: '/tool/dojo' },
]

export const toolCategories = [
  { id: 'general', label: 'General' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'technical', label: 'Technical' },
 
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