export function parsePodcastScript(script) {
  const lines = script.split('\n').filter((l) => l.trim())
  const segments = []

  for (const line of lines) {
    if (line.startsWith('ALEX:')) {
      segments.push({
        speaker: 'ALEX',
        text: line.replace('ALEX:', '').trim(),
      })
    } else if (line.startsWith('SAM:')) {
      segments.push({
        speaker: 'SAM',
        text: line.replace('SAM:', '').trim(),
      })
    }
  }

  return segments
}

export function getAvailableVoices() {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices()
    if (voices.length) {
      resolve(voices)
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        resolve(window.speechSynthesis.getVoices())
      }
    }
  })
}

export function pickVoices(voices) {
  // Try to pick two distinct voices — one for Alex, one for Sam
  const english = voices.filter((v) =>
    v.lang.startsWith('en') && !v.name.includes('Zira')
  )

  const female = english.find((v) =>
    /female|woman|girl|zira|samantha|victoria|karen|moira|fiona|tessa/i.test(v.name)
  ) || english[0]

  const male = english.find((v) =>
    v !== female &&
    (/male|man|guy|daniel|alex|david|mark|fred|ralph|bruce|lee/i.test(v.name) || true)
  ) || english[1] || english[0]

  return { alex: female, sam: male }
}

export function speakSegment(text, voice, rate = 0.95, pitch = 1) {
  return new Promise((resolve, reject) => {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    if (voice) utterance.voice = voice
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.onend = resolve
    utterance.onerror = reject
    window.speechSynthesis.speak(utterance)
  })
}