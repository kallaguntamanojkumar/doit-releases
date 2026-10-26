// Swaps the video's poster for YouTube's privacy-enhanced player on the first click, so the page
// loads nothing from YouTube until a visitor asks for it. Without scripts, the poster is a link to
// the video on YouTube.

for (const poster of document.querySelectorAll('[data-youtube]')) {
  poster.addEventListener('click', (event) => {
    // Let a new-tab or new-window click open YouTube as a link
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    const player = document.createElement('iframe')
    player.className = 'video-player'
    player.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(poster.dataset.youtube)}?autoplay=1&rel=0`
    player.title = 'doIT overview'
    player.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'
    player.allowFullscreen = true
    // YouTube's player needs the page's origin to play
    player.referrerPolicy = 'strict-origin-when-cross-origin'
    poster.replaceWith(player)
    player.focus()
  })
}
