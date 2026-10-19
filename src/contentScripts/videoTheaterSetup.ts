import { cleanupTheaterDanmakuControl, isTheaterDanmakuControlReady, setupTheaterDanmakuControl } from './videoTheater'

const isPlaybackPage = () => /^https?:\/\/(?:www\.)?bilibili\.com\/(?:video|list)\//.test(location.href)

export function setupVideoTheater() {
  if (!isPlaybackPage() || window.self !== window.top)
    return

  let currentUrl = location.href
  let initialized = false
  let switchRequested = false
  let scheduled = false
  let disposed = false
  let animationFrame = 0
  let host: HTMLElement | null = null
  let player: Element | null = null
  let video: HTMLVideoElement | null = null
  let viewportRoot: HTMLElement | null = null
  let viewportWidth = 0

  const schedule = () => {
    if (disposed || scheduled)
      return
    scheduled = true
    animationFrame = requestAnimationFrame(() => {
      scheduled = false
      update()
    })
  }

  const viewportObserver = new ResizeObserver((entries) => {
    const nextWidth = entries[0]?.contentRect.width
    if (nextWidth && nextWidth !== viewportWidth) {
      viewportWidth = nextWidth
      viewportRoot?.style.setProperty('--bew-theater-width', `${nextWidth}px`)
    }
  })
  const modeObserver = new MutationObserver(schedule)
  const structureObserver = new MutationObserver(schedule)

  const observeStructure = () => {
    structureObserver.disconnect()
    if (!host) {
      // Discovery only: stop observing the document as soon as the host exists.
      structureObserver.observe(document, { childList: true, subtree: true })
      return
    }
    const bootstrapping = !initialized || !isTheaterDanmakuControlReady()
    if (bootstrapping) {
      structureObserver.observe(host, { childList: true, subtree: true })
    }
    // Once ready, only watch container replacements. Danmaku, comments and
    // recommendation updates must not schedule theater work on every frame.
    const controls = host.querySelector('.bpx-player-control-bottom-right')
    const source = host.querySelector('.bpx-player-dm-switch')
    const targets = new Set([
      host,
      host.parentElement,
      host.parentElement?.parentElement,
      document.getElementById('bilibili-player'),
      player,
      controls,
      controls?.parentElement,
      controls?.parentElement?.parentElement,
      source?.parentElement,
      source?.parentElement?.parentElement,
    ])
    targets.forEach((target) => {
      if (target && (!bootstrapping || target !== host))
        structureObserver.observe(target, { childList: true })
    })
    if (source)
      structureObserver.observe(source, { childList: true, subtree: true })
  }

  function update() {
    const root = document.documentElement
    if (root && root !== viewportRoot) {
      viewportRoot = root
      viewportObserver.observe(root)
    }

    if (location.href !== currentUrl) {
      currentUrl = location.href
      initialized = false
      switchRequested = false
      root?.classList.toggle('bew-theater-page', isPlaybackPage())
      root?.classList.toggle('bew-theater-pending', isPlaybackPage())
    }
    if (!isPlaybackPage()) {
      root?.classList.remove('bew-theater-active', 'bew-theater-pending')
      structureObserver.disconnect()
      modeObserver.disconnect()
      player = null
      video?.removeEventListener('loadeddata', schedule)
      video?.removeEventListener('playing', schedule)
      video = null
      cleanupTheaterDanmakuControl()
      return
    }

    const nextHost = document.getElementById('playerWrap')
    if (nextHost !== host) {
      host = nextHost
      initialized = false
      switchRequested = false
    }
    const nextPlayer = host?.querySelector('.bpx-player-container') || null
    if (nextPlayer !== player) {
      player = nextPlayer
      initialized = false
      switchRequested = false
      modeObserver.disconnect()
      if (player)
        modeObserver.observe(player, { attributes: true, attributeFilter: ['data-screen'] })
    }
    const nextVideo = host?.querySelector('video') || null
    if (nextVideo !== video) {
      video?.removeEventListener('loadeddata', schedule)
      video?.removeEventListener('playing', schedule)
      video = nextVideo
      video?.addEventListener('loadeddata', schedule)
      video?.addEventListener('playing', schedule)
    }

    if (video && video.readyState >= 2)
      setupTheaterDanmakuControl()
    const screen = player?.getAttribute('data-screen')
    root?.classList.toggle('bew-theater-active', screen === 'wide')
    if (screen && ['wide', 'web', 'full', 'mini'].includes(screen)) {
      root?.classList.remove('bew-theater-pending')
      initialized = true
    }
    // The pending CSS already provides theater geometry. Let the first frame
    // load before asking the native player to change mode and recompute sizes.
    if (!initialized && !switchRequested && video && video.readyState >= 2) {
      const button = host?.querySelector<HTMLElement>('.bpx-player-ctrl-wide')
      if (button) {
        switchRequested = true
        button.click()
      }
    }
    observeStructure()
  }

  const navigation = (window as Window & { navigation?: EventTarget }).navigation
  navigation?.addEventListener('navigatesuccess', schedule)
  window.addEventListener('popstate', schedule)
  update()

  return () => {
    disposed = true
    cancelAnimationFrame(animationFrame)
    cleanupTheaterDanmakuControl()
    viewportObserver.disconnect()
    modeObserver.disconnect()
    structureObserver.disconnect()
    video?.removeEventListener('loadeddata', schedule)
    video?.removeEventListener('playing', schedule)
    navigation?.removeEventListener('navigatesuccess', schedule)
    window.removeEventListener('popstate', schedule)
  }
}
