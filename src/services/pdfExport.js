export async function downloadAsPDF(elementId, filename = 'download.pdf') {
  const element = document.getElementById(elementId)
  if (!element) {
    console.error(`Element #${elementId} not found`)
    return
  }

  try {
    const html2pdf = (await import('html2pdf.js')).default

    const options = {
      margin: [10, 10, 10, 10],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
      },
    }

    await html2pdf().set(options).from(element).save()
  } catch (err) {
    console.error('PDF export failed:', err)
    alert('PDF export failed. Try again.')
  }
}

export async function downloadTextAsPDF(text, filename = 'document.pdf') {
  try {
    const html2pdf = (await import('html2pdf.js')).default

    // Convert plain text to styled HTML
    const html = `
      <div style="font-family: Georgia, serif; font-size: 12pt; line-height: 1.8; color: #1a1a1a; padding: 20px;">
        ${text
          .split('\n')
          .map((line) => {
            if (!line.trim()) return '<br/>'
            // Detect section headers (all caps lines)
            if (line.trim() === line.trim().toUpperCase() && line.trim().length > 3 && line.trim().length < 60) {
              return `<h3 style="font-size: 13pt; font-weight: bold; margin-top: 16px; margin-bottom: 6px; letter-spacing: 0.05em;">${line}</h3>`
            }
            return `<p style="margin: 0 0 8px 0;">${line}</p>`
          })
          .join('')
        }
      </div>
    `

    const options = {
      margin: [20, 20, 20, 20],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    }

    const element = document.createElement('div')
    element.innerHTML = html
    document.body.appendChild(element)

    await html2pdf().set(options).from(element).save()
    document.body.removeChild(element)
  } catch (err) {
    console.error('PDF export failed:', err)
    alert('PDF export failed. Try again.')
  }
}