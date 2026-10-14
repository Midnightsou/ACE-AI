export const TOUR_KEY = 'ace_tour_done'

export function tourDone() {
  try { return localStorage.getItem(TOUR_KEY) === '1' } catch { return false }
}

export function markTourDone() {
  try { localStorage.setItem(TOUR_KEY, '1') } catch {}
}
