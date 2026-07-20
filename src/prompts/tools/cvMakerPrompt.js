import { NO_MARKDOWN_RULE } from '../shared'

export function buildCVPrompt(data) {
  return {
    system: `You are a senior CV consultant...
${NO_MARKDOWN_RULE}`,
    user: `...`
  }
}