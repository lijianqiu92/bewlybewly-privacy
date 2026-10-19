let activePreview: (() => void) | undefined

export function claimVideoPreview(stop: () => void) {
  const previous = activePreview
  activePreview = stop
  if (previous && previous !== stop)
    previous()
}

export function releaseVideoPreview(stop: () => void) {
  if (activePreview === stop)
    activePreview = undefined
}

export function unloadVideoPreview(video: HTMLVideoElement | null) {
  if (!video)
    return
  video.pause()
  const sources = video.querySelectorAll('source[src]')
  if (video.hasAttribute('src') || sources.length) {
    video.removeAttribute('src')
    sources.forEach(source => source.removeAttribute('src'))
    // Reset the media pipeline instead of leaving detached previews decoding.
    video.load()
  }
}
