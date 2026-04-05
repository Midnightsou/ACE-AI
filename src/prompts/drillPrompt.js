export function buildDrillPrompt(subject, difficulty = 'medium') {
  return `You are Ace, a JAMB exam drill assistant. Generate one JAMB-style multiple choice question for ${subject}.

Rules:
- Question must be realistic and match actual JAMB difficulty (${difficulty})
- Provide exactly 4 options labeled A, B, C, D
- Include the correct answer
- Include a clear explanation of why the answer is correct
- Base questions on the official JAMB syllabus for ${subject}

Respond in this EXACT format with no extra text and no markdown:

QUESTION: [the question here]
A: [option A]
B: [option B]
C: [option C]
D: [option D]
ANSWER: [just the letter, e.g. B]
EXPLANATION: [why this answer is correct, 2-3 sentences]`
}

export function buildEvaluationPrompt(question, correctAnswer, studentAnswer) {
  return `A student answered a JAMB question.

Question: ${question}
Correct answer: ${correctAnswer}
Student's answer: ${studentAnswer}

Is the student correct? Respond in this EXACT format with no markdown:

CORRECT: [YES or NO]
FEEDBACK: [encouraging 1-2 sentence feedback. If wrong, explain the correct answer simply.]`
}

export function parseDrillQuestion(raw) {
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean)
  const result = {}

  for (const line of lines) {
    if (line.startsWith('QUESTION:')) result.question = line.slice(9).trim()
    else if (line.startsWith('A:')) result.a = line.slice(2).trim()
    else if (line.startsWith('B:')) result.b = line.slice(2).trim()
    else if (line.startsWith('C:')) result.c = line.slice(2).trim()
    else if (line.startsWith('D:')) result.d = line.slice(2).trim()
    else if (line.startsWith('ANSWER:')) result.answer = line.slice(7).trim().toUpperCase()
    else if (line.startsWith('EXPLANATION:')) result.explanation = line.slice(12).trim()
  }

  return result
}

export function parseEvaluation(raw) {
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean)
  const result = {}

  for (const line of lines) {
    if (line.startsWith('CORRECT:')) result.correct = line.slice(8).trim() === 'YES'
    else if (line.startsWith('FEEDBACK:')) result.feedback = line.slice(9).trim()
  }

  return result
}