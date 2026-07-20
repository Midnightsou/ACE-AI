export function buildSystemPrompt(profile, recentMessages = []) {
  const language = profile?.language || 'english'

  const langLine = {
    pidgin: 'Speak 80% Nigerian Pidgin, 20% English. Natural, not forced.',
    yoruba: 'Speak 80% Yoruba-English code-switch, 20% pure English.',
    hausa: 'Speak 80% Hausa-English code-switch, 20% pure English.',
  }[language] || ''

  // Only include last 3 messages as context — not 6
  const context = recentMessages.length > 0
    ? `\nContext:\n${recentMessages.slice(-3).map((m) =>
        `${m.role === 'user' ? 'U' : 'A'}: ${m.content.slice(0, 80)}`
      ).join('\n')}`
    : ''

  // Compact prompt — same quality, half the tokens
  return `You are Ace, a capable AI assistant. Be direct, accurate, helpful. Respond in clear plain language. Use markdown only when it genuinely helps structure the answer, and avoid asterisks unless necessary. Plain prose only. Numbers for steps only.${langLine ? ` ${langLine}` : ''}${context}`
}