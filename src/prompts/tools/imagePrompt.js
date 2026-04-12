export function buildPromptEnhancerSystem() {
  return `You are an expert AI image prompt engineer. Your job is to take a user's simple image description and enhance it into a detailed, high-quality prompt for an AI image generation model.

Rules:
- Expand the prompt with relevant artistic details
- Add lighting, mood, style, composition details
- Keep the enhanced prompt under 200 words
- Return ONLY the enhanced prompt — no explanation, no preamble, no quotes
- Do not add anything the user didn't ask for — just enhance what they described
- Never refuse — always enhance the prompt`
}

export function buildPromptEnhancerUser(userPrompt, style) {
  return `Enhance this image prompt for AI generation:

User prompt: "${userPrompt}"
Style: ${style}

Return only the enhanced prompt.`
}

export const stylePresets = [
  { id: 'none', label: 'None', suffix: '' },
  { id: 'photorealistic', label: 'Photorealistic', suffix: 'photorealistic, hyperrealistic, 8k, detailed photography, natural lighting' },
  { id: 'anime', label: 'Anime', suffix: 'anime style, manga art, vibrant colors, Studio Ghibli inspired' },
  { id: 'watercolor', label: 'Watercolor', suffix: 'watercolor painting, soft brushstrokes, artistic, flowing colors' },
  { id: 'oil-painting', label: 'Oil Painting', suffix: 'oil painting, classical art style, rich textures, painterly' },
  { id: '3d', label: '3D Render', suffix: '3D render, octane render, cinema 4D, volumetric lighting, glossy' },
  { id: 'abstract', label: 'Abstract', suffix: 'abstract art, geometric shapes, modern art, bold colors' },
  { id: 'sketch', label: 'Pencil Sketch', suffix: 'pencil sketch, hand drawn, detailed linework, graphite' },
  { id: 'pixel', label: 'Pixel Art', suffix: 'pixel art, 16-bit, retro gaming style, pixelated' },
  { id: 'cinematic', label: 'Cinematic', suffix: 'cinematic shot, movie still, dramatic lighting, anamorphic lens' },
  { id: 'cartoon', label: 'Cartoon', suffix: 'cartoon style, flat design, bold outlines, vibrant' },
  { id: 'fantasy', label: 'Fantasy', suffix: 'fantasy art, magical, ethereal, detailed illustration, epic' },
]

export const aspectRatios = [
  { id: 'square', label: '1:1', width: 1024, height: 1024 },
  { id: 'landscape', label: '16:9', width: 1280, height: 720 },
  { id: 'portrait', label: '9:16', width: 720, height: 1280 },
  { id: 'wide', label: '3:2', width: 1200, height: 800 },
]