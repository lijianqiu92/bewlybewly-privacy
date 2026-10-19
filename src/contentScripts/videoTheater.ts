let currentPlayer: HTMLElement | null = null
let nativeSwitch: HTMLElement | null = null
let nativeInput: HTMLInputElement | null = null
let toggleButton: HTMLButtonElement | null = null
let switchObserver: MutationObserver | undefined

export function isTheaterDanmakuControlReady() {
  return Boolean(nativeSwitch?.isConnected && nativeInput?.isConnected && toggleButton?.isConnected)
}

export function cleanupTheaterDanmakuControl() {
  switchObserver?.disconnect()
  switchObserver = undefined
  currentPlayer = null
  nativeSwitch = null
  nativeInput = null
  toggleButton?.remove()
  toggleButton = null
}

// Keep Bilibili's original control in place: it owns the saved preference and
// player behavior. The theater button forwards clicks and observes its state.
export function setupTheaterDanmakuControl() {
  const player = document.getElementById('bilibili-player')
  if (player === currentPlayer && isTheaterDanmakuControlReady())
    return

  cleanupTheaterDanmakuControl()
  currentPlayer = player

  const source = player?.querySelector<HTMLElement>('.bpx-player-dm-switch')
  const controls = player?.querySelector<HTMLElement>('.bpx-player-control-bottom-right')
  const input = source?.querySelector<HTMLInputElement>('input[type="checkbox"]')
  const onIcon = source?.querySelector<SVGElement>('.bui-danmaku-switch-on svg')
  const offIcon = source?.querySelector<SVGElement>('.bui-danmaku-switch-off svg')
  if (!source || !controls || !input || !onIcon || !offIcon)
    return

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'bpx-player-ctrl-btn bew-theater-danmaku-toggle'

  const enabledIcon = onIcon.cloneNode(true) as SVGElement
  const disabledIcon = offIcon.cloneNode(true) as SVGElement
  enabledIcon.classList.add('bew-danmaku-icon-on')
  disabledIcon.classList.add('bew-danmaku-icon-off')
  enabledIcon.setAttribute('aria-hidden', 'true')
  disabledIcon.setAttribute('aria-hidden', 'true')
  button.append(enabledIcon, disabledIcon)

  const syncState = () => {
    const enabled = input.checked
    const action = enabled ? '关闭弹幕' : '开启弹幕'
    button.setAttribute('aria-pressed', String(enabled))
    button.setAttribute('aria-label', action)
    button.title = action
    button.disabled = input.disabled || source.classList.contains('bui-disabled')
  }

  button.addEventListener('click', (event) => {
    event.stopPropagation()
    // Bilibili listens to the checkbox's native change event. The adjacent
    // label has no `for` attribute, so clicking it does not toggle this input.
    input.click()
    syncState()
  })
  const stopPlaybackShortcut = (event: KeyboardEvent) => {
    if (event.key === ' ' || event.key === 'Enter')
      event.stopPropagation()
  }
  button.addEventListener('keydown', stopPlaybackShortcut)
  button.addEventListener('keyup', stopPlaybackShortcut)

  controls.insertBefore(button, controls.querySelector('.bpx-player-ctrl-volume'))
  nativeSwitch = source
  nativeInput = input
  toggleButton = button
  switchObserver = new MutationObserver(syncState)
  switchObserver.observe(source, {
    attributes: true,
    subtree: true,
    attributeFilter: ['class', 'checked', 'aria-checked', 'disabled'],
  })
  syncState()
}
