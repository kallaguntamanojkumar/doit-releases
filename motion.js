// The page's motion: sections rising into view, the hero window settling flat as you scroll,
// the tour's pinned screenshots, the statement lighting up word by word, counters and the
// terminal typing. The page is complete without any of it, and nothing moves for a visitor
// who asks for reduced motion.
//
// A classic script in <head>, so the classes below are set before the first paint.
;(() => {
  const root = document.documentElement
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const observes = 'IntersectionObserver' in window
  root.classList.add('js')
  if (!reduced && observes) root.classList.add('motion')
  const moving = root.classList.contains('motion')

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value))

  // Runs `update` now and at most once a frame while the page scrolls or resizes.
  function onScroll(update) {
    let queued = false
    const queue = () => {
      if (queued) return
      queued = true
      requestAnimationFrame(() => {
        queued = false
        update()
      })
    }
    addEventListener('scroll', queue, { passive: true })
    addEventListener('resize', queue)
    update()
  }

  // Calls `start(el)` once, when `el` comes into view.
  function whenVisible(elements, start, options = { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }) {
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        io.unobserve(entry.target)
        start(entry.target)
      }
    }, options)
    for (const el of elements) io.observe(el)
  }

  function reveals() {
    const items = [...document.querySelectorAll('[data-reveal]')]
    if (!moving) return
    // Siblings that rise together follow one another.
    for (const el of items) {
      const siblings = [...el.parentElement.children].filter((child) => child.hasAttribute('data-reveal'))
      el.style.setProperty('--delay', `${Math.min(siblings.indexOf(el), 6) * 90}ms`)
    }
    whenVisible(items, (el) => el.classList.add('is-visible'))
  }

  function nav() {
    const bar = document.getElementById('nav')
    if (bar) onScroll(() => bar.classList.toggle('is-scrolled', scrollY > 8))
  }

  // The hero window starts tilted back and lies flat once the page has scrolled half a screen.
  function heroWindow() {
    const stage = document.getElementById('hero-stage')
    if (!stage || !moving) return
    onScroll(() => stage.style.setProperty('--p', clamp(scrollY / (innerHeight * 0.55)).toFixed(3)))
  }

  // The step crossing the middle of the screen picks the pinned screenshot.
  function tour() {
    const steps = [...document.querySelectorAll('.tour-step')]
    const screens = [...document.querySelectorAll('.tour-screens img')]
    const dots = [...document.querySelectorAll('.tour-dots button')]
    if (!steps.length || !observes) return
    let current = 0
    const show = (index) => {
      if (index === current) return
      current = index
      for (const list of [steps, screens, dots]) {
        for (const el of list) el.classList.toggle('is-active', Number(el.dataset.step) === index)
      }
      for (const dot of dots) {
        if (Number(dot.dataset.step) === index) dot.setAttribute('aria-current', 'step')
        else dot.removeAttribute('aria-current')
      }
    }
    dots[0]?.setAttribute('aria-current', 'step')
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) show(Number(entry.target.dataset.step))
      },
      { rootMargin: '-45% 0px -45% 0px' }
    )
    for (const step of steps) io.observe(step)
    for (const dot of dots) {
      dot.addEventListener('click', () => steps[Number(dot.dataset.step)].scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }))
    }
  }

  function counters() {
    const items = [...document.querySelectorAll('[data-count]')]
    if (!moving) return
    for (const el of items) el.textContent = '0'
    whenVisible(
      items,
      (el) => {
        const target = Number(el.dataset.count)
        const began = performance.now()
        const tick = (now) => {
          const t = clamp((now - began) / 1500)
          el.textContent = String(Math.round(target * (1 - (1 - t) ** 3)))
          if (t < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { threshold: 0.6 }
    )
  }

  // The statement's words light up as it scrolls through the screen.
  function scrub() {
    const el = document.querySelector('[data-scrub]')
    if (!el || !moving) return
    const text = el.textContent.trim().replace(/\s+/g, ' ')
    const spoken = document.createElement('span')
    spoken.className = 'visually-hidden'
    spoken.textContent = text
    const shown = document.createElement('span')
    shown.setAttribute('aria-hidden', 'true')
    const words = text.split(' ').map((word) => {
      const span = document.createElement('span')
      span.className = 'w'
      span.textContent = word
      return span
    })
    words.forEach((word, i) => shown.append(...(i ? [' ', word] : [word])))
    el.replaceChildren(spoken, shown)
    onScroll(() => {
      const box = el.getBoundingClientRect()
      const progress = clamp((innerHeight * 0.82 - box.top) / (box.height + innerHeight * 0.3))
      const lit = Math.round(progress * words.length)
      words.forEach((word, i) => word.classList.toggle('on', i < lit))
    })
  }

  // The terminal types its commands and prints their output, once, when it comes into view.
  function terminal() {
    const body = document.querySelector('[data-type]')
    if (!body || !moving) return
    const lines = [...body.querySelectorAll('.t-line')]
    const script = lines.map((line) => {
      const prompt = line.querySelector('.t-prompt')
      return { line, prompt, command: prompt ? line.textContent.slice(prompt.textContent.length).trim() : null }
    })
    for (const line of lines) line.classList.add('t-pending')
    const caret = document.createElement('span')
    caret.className = 't-caret'
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
    whenVisible(
      [body],
      async () => {
        await wait(400)
        for (const step of script) {
          step.line.classList.remove('t-pending')
          if (step.command === null) {
            caret.remove()
            await wait(220)
            continue
          }
          const typed = document.createTextNode(' ')
          step.line.replaceChildren(step.prompt, typed, caret)
          await wait(350)
          for (const ch of step.command) {
            typed.data += ch
            await wait(22 + Math.random() * 38)
          }
          await wait(450)
        }
        const prompt = document.createElement('span')
        prompt.className = 't-prompt'
        prompt.textContent = '$'
        const ready = document.createElement('span')
        ready.className = 't-line'
        ready.append(prompt, ' ', caret)
        body.append('\n', ready)
      },
      { threshold: 0.5 }
    )
  }

  // A soft light follows the pointer across the feature tiles.
  function spotlight() {
    if (!moving || !matchMedia('(hover: hover)').matches) return
    for (const tile of document.querySelectorAll('.tile')) {
      tile.addEventListener('pointermove', (event) => {
        const box = tile.getBoundingClientRect()
        tile.style.setProperty('--mx', `${event.clientX - box.left}px`)
        tile.style.setProperty('--my', `${event.clientY - box.top}px`)
      })
    }
  }

  function start() {
    reveals()
    nav()
    heroWindow()
    tour()
    counters()
    scrub()
    terminal()
    spotlight()
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start)
  else start()
})()
