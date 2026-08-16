/*
 * Copying the invite link, including where the modern API isn't there.
 *
 * `navigator.clipboard` is secure-context only, so on a wall served over
 * plain http by the phone in the kitchen it is simply undefined. The old
 * execCommand path still works there, and handing someone the invite link
 * is exactly the moment you don't want to fall back to "select it by hand".
 */

export async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      /* Permission denied, or exposed but refused. Try the old way. */
    }
  }
  return legacyCopy(text)
}

function legacyCopy(text: string): boolean {
  const field = document.createElement('textarea')
  field.value = text
  field.setAttribute('readonly', '')
  // Off-screen, but still selectable, which is what execCommand needs.
  field.style.position = 'fixed'
  field.style.top = '-1000px'
  field.style.opacity = '0'
  document.body.appendChild(field)

  try {
    field.select()
    field.setSelectionRange(0, text.length)
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    document.body.removeChild(field)
  }
}
