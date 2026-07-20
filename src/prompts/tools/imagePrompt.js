export const stylePresets = [
  { id: 'realistic', label: 'Realistic', suffix: 'photorealistic, detailed' },
  { id: 'anime', label: 'Anime', suffix: 'anime style, vibrant' },
  { id: 'minimal', label: 'Minimal', suffix: 'minimalist, clean composition' },
  { id: 'fantasy', label: 'Fantasy', suffix: 'fantasy illustration, rich detail' },
]

export const aspectRatios = [
  { id: '1:1', label: 'Square' },
  { id: '16:9', label: 'Landscape' },
  { id: '9:16', label: 'Portrait' },
]

export function buildPromptEnhancerSystem() {
  return 'You are an image prompt enhancer. Expand the user prompt into a vivid, detailed image-generation prompt while preserving the requested concept. Respond in plain, clear language and use markdown only when it genuinely helps structure the output.'
}

export function buildPromptEnhancerUser(prompt = '', style = 'realistic') {
  return `Enhance the following image prompt for style: ${style}.\n\nPrompt: ${prompt}`
}
