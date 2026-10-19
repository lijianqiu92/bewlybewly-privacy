// Runs before the main bundle so the server-rendered skeleton starts in the
// same layout as the player. This does not wait for settings or player controls.
(() => {
  const prepareLayout = () => {
    const root = document.documentElement
    if (!root)
      return false

    const width = root.clientWidth
    if (width > 0)
      root.style.setProperty('--bew-theater-width', `${width}px`)
    root.classList.add('bew-theater-page', 'bew-theater-pending')
    return true
  }

  if (prepareLayout())
    return

  const observer = new MutationObserver(() => {
    if (prepareLayout())
      observer.disconnect()
  })
  observer.observe(document, { childList: true })
})()
