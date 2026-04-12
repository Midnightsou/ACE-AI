import { useState } from 'react'
import { useImageStore } from '../store/imageStore'
import { useUserStore } from '../store/userStore'
import {
  buildPromptEnhancerSystem,
  buildPromptEnhancerUser,
  stylePresets,
} from '../prompts/tools/imagePrompt'
import { saveToolSession } from '../services/memory'

const FEATHERLESS_URL = 'https://api.featherless.ai/v1/chat/completions'
const HF_URL = 'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell/v1/images/generations'

async function enhancePrompt(userPrompt, style) {
  const apiKey = import.meta.env.VITE_FEATHERLESS_API_KEY
  try {
    const response = await fetch(FEATHERLESS_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-ai/DeepSeek-V3.2',
        messages: [
          { role: 'system', content: buildPromptEnhancerSystem() },
          { role: 'user', content: buildPromptEnhancerUser(userPrompt, style) },
        ],
        temperature: 0.8,
        max_tokens: 300,
        stream: false,
      }),
    })
    const data = await response.json()
    return data.choices?.[0]?.message?.content?.trim() || userPrompt
  } catch {
    return userPrompt
  }
}

async function generateImage(prompt, style, width, height) {
  const hfKey = import.meta.env.VITE_HF_API_KEY
  const styleObj = stylePresets.find((s) => s.id === style)
  const fullPrompt = styleObj?.suffix ? `${prompt}, ${styleObj.suffix}` : prompt

  const response = await fetch(HF_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${hfKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: fullPrompt,
      width,
      height,
      num_inference_steps: 4,
      guidance_scale: 0,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error || `Image generation failed: ${response.status}`)
  }

  const blob = await response.blob()
  return URL.createObjectURL(blob)
}

export function useImageCreator() {
  const { messages, addMessage, clearMessages } = useImageStore()
  const user = useUserStore((s) => s.user)
  const [loading, setLoading] = useState(false)
  const [enhancing, setEnhancing] = useState(false)

  async function generate({ prompt, style, width, height, useEnhancer }) {
    if (!prompt.trim() || loading) return

    addMessage({ role: 'user', content: prompt, style })
    setLoading(true)

    try {
      let finalPrompt = prompt

      if (useEnhancer) {
        setEnhancing(true)
        finalPrompt = await enhancePrompt(prompt, style)
        setEnhancing(false)
      }

      const imageUrl = await generateImage(finalPrompt, style, width, height)

      addMessage({
        role: 'assistant',
        type: 'image',
        imageUrl,
        prompt: finalPrompt,
        originalPrompt: prompt,
        style,
        width,
        height,
        seed: Date.now(),
      })

      if (user?.uid) {
        await saveToolSession(
          user.uid,
          'image-creator',
          'Image Creator',
          `Image — ${prompt.slice(0, 40)}${prompt.length > 40 ? '...' : ''}`,
          '🎨'
        ).catch(() => {})
      }

    } catch (err) {
      setEnhancing(false)
      addMessage({
        role: 'assistant',
        type: 'error',
        content: `Failed to generate image: ${err.message}. Check your HF API key and try again.`,
      })
      console.error('Image generation error:', err)
    } finally {
      setLoading(false)
      setEnhancing(false)
    }
  }

  async function regenerate(originalPrompt, style, width, height) {
    await generate({ prompt: originalPrompt, style, width, height, useEnhancer: false })
  }

  return { messages, loading, enhancing, generate, regenerate, clearMessages }
}