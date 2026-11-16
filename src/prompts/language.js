const LANGUAGE_NAMES = {
  english: 'English',
  pidgin: 'Nigerian Pidgin English',
  yoruba: 'Yoruba',
  hausa: 'Hausa',
}

export function buildPreferredLanguageInstruction(language = 'english') {
  const preferredLanguage = LANGUAGE_NAMES[language] || LANGUAGE_NAMES.english
  if (language === 'english') {
    return 'Respond in English unless the user explicitly asks for another language.'
  }

  return `Reply primarily in ${preferredLanguage}, even when the user's message is in English. Use English only for technical terms or where it improves clarity. Switch to English only when the user explicitly asks.`
}
