console.log(`%c:---)`, 'padding: 5px; background: blue; color: white;')

const bio = document.querySelector('#bio')
const c = document.querySelector('#c')
const frame = document.querySelector('#frame')
const right = document.querySelector('#right')
const projs = [].slice.call(document.querySelectorAll('.proj'))
const project = new URLSearchParams(window.location.search).get('project')
const blogButton = document.querySelector('#blog-button')

// blog mode: #right shows #blog instead of the iframe; on a gallery's own page the left column also collapses (--blog-left in style.css)
function setBlog(on) {
  document.body.classList.toggle('blog', on)
  if (!on) document.body.classList.remove('blog-gallery')
  if (on) {
    projs.forEach((e) => e.classList.remove('show'))
    frame.src = ''
    right.style.display = 'block'
  } else {
    right.style.display = 'none'
  }
}

// blog button: home -> feed, feed -> home, single post -> feed
blogButton.addEventListener('click', (event) => {
  event.preventDefault()
  const path = blogPath()
  go(path && !path.post ? '/' : '/blog')
})

// /blog is the feed (600px column); /blog/<post-id> is that post on its own,
// a picture post as a gallery filling the panel
const blog = document.querySelector('#blog')

// each post has a unix time (data-time, from build-blog.js). The permalink is
// /blog/<id> for posts with an id (folders), else /blog/<time>; the label is
// "DD.MM.YYYY, <time>" unless the post has its own caption
const posts = [].slice.call(blog.querySelectorAll('.post'))

function permalink(post) {
  return `/blog/${post.id || post.dataset.time}`
}

posts.forEach((post) => {
  const label = [post.dataset.date, post.dataset.time].filter(Boolean).join(', ')
  const caption = post.querySelector('.caption')
  if (caption) {
    caption.href = permalink(post)
    if (!caption.textContent.trim()) caption.textContent = label
  } else if (post.classList.contains('text')) {
    post.insertAdjacentHTML('afterbegin', `<small class="label"><a href="${permalink(post)}">${label}</a><span>txt</span></small>`)
  } else if (post.classList.contains('stack')) {
    // a stack of pictures: same label, type "imgs", not a link (the post isn't clickable)
    // a titled single picture/video: its caption instead, type "video" for a video
    const video = post.querySelectorAll('.slides > *').length === 1 && post.querySelector('.slides > video')
    const type = video ? 'video' : 'imgs'
    // with a link, the right side is that link, shown without https://
    const shown = (post.dataset.link || '').replace(/^https?:\/\//, '').replace(/\/$/, '')
    const right = post.dataset.link ? `<a href="${post.dataset.link}" target="_blank">${shown}</a>` : `<span>${type}</span>`
    post.insertAdjacentHTML('afterbegin', `<small class="label"><span>${post.dataset.caption || label}</span>${right}</small>`)
  }
})

// local editing (npm run dev only): a text post is editable on its own page
// (/blog/<time>), plain text only, and every pause in typing writes the .txt
// file and rebuilds the blog. syncEditing runs on every route change
let syncEditing = () => {}

if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
  fetch('/__blog-edit')
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => d && d.edit && enableEditing())
    .catch(() => {})
}

function enableEditing() {
  document.execCommand('defaultParagraphSeparator', false, 'p')

  // DOM -> .txt: blocks are paragraphs (blank line between), links become [text](url)
  function inline(node) {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent.replace(/\u00a0/g, ' ')
    if (node.nodeName === 'BR') return '\n'
    const inner = [].map.call(node.childNodes, inline).join('')
    if (node.nodeName === 'A' && node.getAttribute('href')) return `[${inner}](${node.getAttribute('href')})`
    return inner
  }

  function toText(body) {
    const blocks = []
    let loose = ''
    ;[].forEach.call(body.childNodes, (node) => {
      if (node.nodeName === 'P' || node.nodeName === 'DIV') {
        blocks.push(loose, inline(node))
        loose = ''
      } else loose += inline(node)
    })
    blocks.push(loose)
    return blocks
      .map((b) => b.replace(/\n+$/, '').trim())
      .filter(Boolean)
      .join('\n\n')
  }

  posts
    .filter((post) => post.classList.contains('text'))
    .forEach((post) => {
      const body = post.querySelector('.body')
      if (!body) return
      let timer = null

      const save = () =>
        fetch('/__blog-edit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ time: post.dataset.time, text: toText(body) }),
        }).catch((e) => console.error('blog save failed', e))

      // undo/redo: our own history (the browser's is unreliable here). A step is
      // taken after each pause in typing; it keeps the html and the caret position
      const history = { steps: [], index: -1, pending: null }

      function caretOffset() {
        const sel = window.getSelection()
        if (!sel.rangeCount || !body.contains(sel.anchorNode)) return null
        const range = document.createRange()
        range.selectNodeContents(body)
        range.setEnd(sel.anchorNode, sel.anchorOffset)
        return range.toString().length
      }

      function placeCaret(offset) {
        if (offset == null) return
        const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT)
        let node
        let left = offset
        while ((node = walker.nextNode())) {
          if (left <= node.textContent.length) {
            const range = document.createRange()
            range.setStart(node, left)
            range.collapse(true)
            const sel = window.getSelection()
            sel.removeAllRanges()
            sel.addRange(range)
            return
          }
          left -= node.textContent.length
        }
      }

      function snapshot() {
        clearTimeout(history.pending)
        history.pending = null
        const html = body.innerHTML
        if (history.steps[history.index] && history.steps[history.index].html === html) return
        history.steps = history.steps.slice(0, history.index + 1)
        history.steps.push({ html, caret: caretOffset() })
        history.index = history.steps.length - 1
      }

      function travel(delta) {
        if (history.pending) snapshot() // keep what was typed since the last pause
        const next = history.index + delta
        if (next < 0 || next >= history.steps.length) return
        history.index = next
        body.innerHTML = history.steps[next].html
        placeCaret(history.steps[next].caret)
        clearTimeout(timer)
        save()
      }

      snapshot()

      body.addEventListener('input', () => {
        clearTimeout(timer)
        timer = setTimeout(save, 400)
        clearTimeout(history.pending)
        history.pending = setTimeout(snapshot, 400)
      })

      // the browser's own undo (e.g. Edit menu) goes through our history too
      body.addEventListener('beforeinput', (event) => {
        if (event.inputType === 'historyUndo' || event.inputType === 'historyRedo') {
          event.preventDefault()
          travel(event.inputType === 'historyUndo' ? -1 : 1)
        }
      })

      // writing only: no bold/italic/underline; Cmd+Z undo, Cmd+Shift+Z / Cmd+Y redo
      body.addEventListener('keydown', (event) => {
        if (!(event.metaKey || event.ctrlKey)) return
        const key = event.key.toLowerCase()
        if (['b', 'i', 'u'].includes(key)) event.preventDefault()
        if (key === 'z' || key === 'y') {
          event.preventDefault()
          travel(key === 'y' || event.shiftKey ? 1 : -1)
        }
      })
      body.addEventListener('paste', (event) => {
        event.preventDefault()
        document.execCommand('insertText', false, event.clipboardData.getData('text/plain'))
      })
      body.addEventListener('drop', (event) => event.preventDefault())
    })

  // only the post shown on its own page is editable
  syncEditing = () =>
    posts.forEach((post) => {
      const body = post.classList.contains('text') && post.querySelector('.body')
      if (body) body.contentEditable = post.classList.contains('active') ? 'true' : 'false'
    })
  syncEditing()
}

function findPost(key) {
  return posts.find((p) => p.id === key) || posts.find((p) => p.dataset.time === key) || null
}

function blogPath() {
  const match = window.location.pathname.match(/^\/blog(?:\/([^/]+))?\/?$/)
  return match ? { post: match[1] } : null
}

function routeBlog() {
  const path = blogPath()
  setBlog(Boolean(path))
  const post = path && path.post ? findPost(decodeURIComponent(path.post)) : null
  blog.classList.toggle('single', Boolean(post))
  // the left column collapses only on a gallery's own page
  document.body.classList.toggle('blog-gallery', Boolean(post && post.classList.contains('gallery')))
  posts.forEach((p) => p.classList.toggle('active', p === post))
  blog.scrollTop = 0
  galleries.forEach((g) => g.reset())
  syncEditing()
  return Boolean(path)
}

function go(url) {
  window.history.pushState({}, '', url)
  routeBlog()
}

window.addEventListener('popstate', routeBlog)

// permalinks inside the blog: no reload
blog.addEventListener('click', (event) => {
  const link = event.target.closest('a[href^="/blog"]')
  if (link) {
    event.preventDefault()
    return go(link.getAttribute('href'))
  }
  // in the feed a click anywhere on a post opens its own page (links in the
  // text still go to their sources; a gallery's pictures handle their own click)
  if (blog.classList.contains('single') || event.target.closest('a')) return
  const post = event.target.closest('.post')
  if (!post || (post.classList.contains('gallery') && event.target.closest('.slides'))) return
  go(permalink(post)) // opens scrolled to the top (routeBlog)
})

// picture/video posts and collections. Feed: single items in full, a collection
// as its cover; a click opens the post (a collection at picture 1). Own page: one item at a time filling the panel; a click
// in the middle (--blog-width) zooms in (it follows the mouse), left/right of it
// steps back/forward, so do the arrow keys
// galleries (folders) and single pictures/videos: on their own page a slider
// filling the panel. Stacks ("imgs") are not galleries: their page shows the
// pictures one after another
const galleries = [].slice.call(document.querySelectorAll('.post.gallery')).map((post) => {
  const slides = post.querySelector('.slides')
  const items = [].slice.call(slides.children)
  // where the type/counter goes: a gallery's .count, a stack's label (right side)
  const count = post.querySelector('.count')
  const type = post.classList.contains('collection') ? 'gallery' : ''
  let index = 0
  let start = 0

  function active() {
    return post.classList.contains('active')
  }

  function show(n) {
    zoom(false)
    resetView()
    index = (n + items.length) % items.length
    items.forEach((item, k) => item.classList.toggle('on', k === index))
    if (count) count.textContent = active() && items.length > 1 ? `${index + 1}/${items.length}` : type
    // preload and decode the neighbours, so sliding them in doesn't stall
    ;[index + 1, index - 1].forEach((k) => {
      const item = items[(k + items.length) % items.length]
      if (item.tagName !== 'IMG') return
      item.loading = 'eager'
      if (active() && item.decode) item.decode().catch(() => {})
    })
  }

  // zoom: scale the item up to its full resolution (at least 2x), the
  // transform origin follows the mouse so moving pans across it
  function zoom(on, event) {
    const item = items[index]
    slides.classList.toggle('zoomed', on)
    if (!on || !item) {
      if (item) item.style.transform = item.style.transformOrigin = ''
      return
    }
    const natural = item.naturalWidth || item.videoWidth || 0
    const scale = Math.max(2, natural / (window.devicePixelRatio || 1) / item.clientWidth)
    item.style.transform = `scale(${scale})`
    pan(event)
  }

  function pan(event) {
    if (!event || !slides.classList.contains('zoomed')) return
    // the mouse position across the whole panel maps to the whole item
    const box = slides.getBoundingClientRect()
    const x = Math.min(Math.max((event.clientX - box.left) / box.width, 0), 1) * 100
    const y = Math.min(Math.max((event.clientY - box.top) / box.height, 0), 1) * 100
    items[index].style.transformOrigin = `${x}% ${y}%`
  }

  // -1 left of the middle column, 0 inside it, 1 right of it. On narrow screens
  // (phones) the middle column is at most a third of the width, so the sides
  // stay tappable
  function zone(event) {
    const box = slides.getBoundingClientRect()
    const column = parseFloat(getComputedStyle(document.body).getPropertyValue('--blog-width')) || 440
    const half = Math.min(column, box.width / 3) / 2
    const offset = event.clientX - (box.left + box.width / 2)
    return Math.abs(offset) <= half ? 0 : Math.sign(offset)
  }

  // touch (phones, tablets): the picture follows the finger and the next or
  // previous one slides in beside it (moves applied once per frame, neighbours
  // decoded ahead). Letting go after an eighth of the width,
  // or after a quick flick, moves on; otherwise it springs back. A new swipe
  // during the animation finishes it at once. Two fingers pinch-zoom around the
  // pinch point, one finger then moves the zoomed picture; a double tap zooms
  // in on the tapped spot and out again. Single taps do nothing (the mouse
  // keeps click-to-zoom)
  const view = { scale: 1, x: 0, y: 0 }
  let touch = null // one finger: { x, y, time, dx, moved, startX, startY, track }
  let pinch = null // two fingers: { dist, scale, mid, x, y }
  let pinched = false // this touch sequence had two fingers: no taps from it
  let lastTouch = 0
  let lastTap = null // { time, x, y }
  let sliding = null // the running slide animation's finish function

  const distance = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
  const middle = (a, b) => ({ x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 })

  function applyView(animate) {
    const item = items[index]
    // keep the zoomed picture covering its own box: no panning past its edges
    const maxX = (item.clientWidth * (view.scale - 1)) / 2
    const maxY = (item.clientHeight * (view.scale - 1)) / 2
    view.x = Math.min(Math.max(view.x, -maxX), maxX)
    view.y = Math.min(Math.max(view.y, -maxY), maxY)
    item.style.transition = animate ? 'transform 220ms ease-out' : 'none'
    item.style.transformOrigin = '50% 50%'
    item.style.transform = view.scale === 1 ? '' : `translate(${view.x}px, ${view.y}px) scale(${view.scale})`
  }

  function resetView() {
    view.scale = 1
    view.x = view.y = 0
  }

  function maxScale() {
    const item = items[index]
    const natural = item.naturalWidth || item.videoWidth || 0
    return Math.min(8, Math.max(3, natural / (window.devicePixelRatio || 1) / (item.clientWidth || 1)))
  }

  // double tap: zoom in so the tapped spot stays under the finger, or back out
  function doubleTap(x, y) {
    if (view.scale > 1) {
      resetView()
    } else {
      const item = items[index]
      const box = item.getBoundingClientRect()
      const scale = Math.min(2.5, maxScale())
      // translate(t) scale(s) around the centre c moves point p to c + t + s(p - c)
      view.scale = scale
      view.x = (x - (box.left + box.width / 2)) * (1 - scale)
      view.y = (y - (box.top + box.height / 2)) * (1 - scale)
    }
    applyView(true)
  }

  // the neighbour on the side we're dragging towards, placed one width away
  function neighbour(dx) {
    return items[(index + (dx < 0 ? 1 : -1) + items.length) % items.length]
  }

  const EASE = 'cubic-bezier(0.22, 0.61, 0.36, 1)' // a soft ease-out
  let peeking = null // the neighbour currently slid in

  function place(dx, duration) {
    const width = slides.clientWidth
    const current = items[index]
    const other = items.length > 1 && dx !== 0 ? neighbour(dx) : null
    // only the two moving pictures are touched (not all of them on every move)
    if (peeking && peeking !== other && peeking !== current) {
      peeking.classList.remove('peek')
      peeking.style.transform = peeking.style.transition = ''
    }
    peeking = other
    const transition = duration ? `transform ${duration}ms ${EASE}` : 'none'
    current.style.transition = transition
    current.style.transform = dx ? `translate3d(${dx}px, 0, 0)` : ''
    if (other) {
      other.classList.add('peek')
      other.style.transition = transition
      other.style.transform = `translate3d(${dx + (dx < 0 ? width : -width)}px, 0, 0)`
    }
  }

  // finger moves are applied once per screen frame
  let frame = null
  function placeSoon(dx) {
    if (frame) cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => {
      frame = null
      place(dx, 0)
    })
  }

  // speed of the finger over its last ~100ms of movement, in px per ms
  // (negative = leftwards); 0 if it rested before lifting
  function velocity(track) {
    const last = track[track.length - 1]
    if (Date.now() - last.t > 100) return 0
    const then = track.find((p) => last.t - p.t <= 100) || track[0]
    return last.t > then.t ? (last.x - then.x) / (last.t - then.t) : 0
  }

  function release(dx, speed) {
    const width = slides.clientWidth
    const flick = Math.abs(speed) > 0.25 && Math.abs(dx) > 15 && Math.sign(speed) === Math.sign(dx)
    const go = items.length > 1 && dx !== 0 && (Math.abs(dx) > width / 8 || flick)
    const target = go ? (dx < 0 ? -width : width) : 0
    // the faster the finger, the quicker the rest of the way (280–450ms)
    const duration = Math.round(Math.min(450, Math.max(280, Math.abs(target - dx) / Math.max(Math.abs(speed), 0.9))))
    if (frame) cancelAnimationFrame(frame)
    frame = null
    place(target, duration)
    // keep the neighbour in view while the current one springs back
    if (!go && dx && items.length > 1) {
      const other = neighbour(dx)
      other.style.transition = `transform ${duration}ms ${EASE}`
      other.style.transform = `translate3d(${dx < 0 ? width : -width}px, 0, 0)`
    }
    const finish = () => {
      if (sliding !== finish) return
      clearTimeout(timer)
      sliding = null
      ;[items[index], peeking].forEach((item) => {
        if (!item) return
        item.classList.remove('peek')
        item.style.transform = item.style.transition = ''
      })
      peeking = null
      if (go) show(index + (dx < 0 ? 1 : -1))
    }
    const timer = setTimeout(finish, duration + 20)
    sliding = finish
  }

  function startTouch(t) {
    touch = { x: t.clientX, y: t.clientY, time: Date.now(), dx: 0, moved: false, startX: view.x, startY: view.y, track: [{ x: t.clientX, t: Date.now() }] }
  }

  slides.addEventListener(
    'touchstart',
    (event) => {
      if (!active()) return
      if (sliding) sliding() // a new swipe during the animation: finish it now
      lastTouch = Date.now()
      if (event.touches.length === 2) {
        if (touch && touch.moved) {
          // a slide in progress becomes a pinch
          if (frame) cancelAnimationFrame(frame)
          frame = null
          place(0, 0)
        }
        touch = null
        pinched = true
        const [a, b] = event.touches
        pinch = { dist: distance(a, b), scale: view.scale, mid: middle(a, b), x: view.x, y: view.y }
      } else if (event.touches.length === 1 && !pinch) {
        pinched = false
        startTouch(event.touches[0])
      }
    },
    { passive: true }
  )

  slides.addEventListener(
    'touchmove',
    (event) => {
      if (!active()) return
      event.preventDefault()
      if (pinch && event.touches.length === 2) {
        const [a, b] = event.touches
        const mid = middle(a, b)
        view.scale = Math.min(Math.max((pinch.scale * distance(a, b)) / pinch.dist, 1), maxScale())
        view.x = pinch.x + (mid.x - pinch.mid.x)
        view.y = pinch.y + (mid.y - pinch.mid.y)
        applyView()
        return
      }
      if (!touch || event.touches.length !== 1) return
      const t = event.touches[0]
      const dx = t.clientX - touch.x
      const dy = t.clientY - touch.y
      if (Math.hypot(dx, dy) > 6) touch.moved = true
      touch.track.push({ x: t.clientX, t: Date.now() })
      if (touch.track.length > 20) touch.track.shift()
      if (view.scale > 1) {
        // zoomed: one finger moves the picture
        view.x = touch.startX + dx
        view.y = touch.startY + dy
        applyView()
        return
      }
      // any one-finger drag slides sideways; with only one picture it just gives a little
      touch.dx = items.length > 1 ? dx : dx / 3
      if (touch.moved) placeSoon(touch.dx)
    },
    { passive: false }
  )

  function touchEnd(event) {
    if (!active()) return
    lastTouch = Date.now()
    if (pinch && event.touches.length < 2) {
      pinch = null
      if (view.scale <= 1.02) {
        resetView()
        applyView(true)
      }
      // a finger still down continues as a one-finger move from here
      if (event.touches.length === 1) startTouch(event.touches[0])
      return
    }
    if (!touch) return
    const t = event.changedTouches[0]
    if (!touch.moved && !pinched && Date.now() - touch.time < 300) {
      // a tap: two within 300ms and 30px are a double tap
      const now = Date.now()
      if (lastTap && now - lastTap.time < 300 && Math.hypot(t.clientX - lastTap.x, t.clientY - lastTap.y) < 30) {
        lastTap = null
        doubleTap(t.clientX, t.clientY)
      } else {
        lastTap = { time: now, x: t.clientX, y: t.clientY }
      }
    } else if (touch.moved && view.scale === 1) {
      release(touch.dx, velocity(touch.track))
    }
    if (event.touches.length === 0) touch = null
  }

  slides.addEventListener('touchend', touchEnd)
  slides.addEventListener('touchcancel', touchEnd)

  slides.addEventListener('click', (event) => {
    if (!active()) {
      start = 0
      return go(permalink(post))
    }
    // taps on touch screens do nothing (the click browsers send after a touch)
    if (Date.now() - lastTouch < 800) return
    if (slides.classList.contains('zoomed')) return zoom(false)
    const z = zone(event)
    if (z === 0) zoom(true, event)
    else show(index + z)
  })

  slides.addEventListener('mousemove', (event) => {
    pan(event)
    if (!active()) slides.style.cursor = 'pointer'
    else if (slides.classList.contains('zoomed')) slides.style.cursor = 'zoom-out'
    else {
      const z = zone(event)
      slides.style.cursor = z === 0 ? 'zoom-in' : z < 0 ? 'w-resize' : 'e-resize'
    }
  })

  // called on every route change: on the post's page start at the clicked item
  function reset() {
    show(active() ? start : 0)
    start = 0
  }

  reset()
  return {
    post,
    reset,
    step: (d) => show(index + d),
    zoomed: () => slides.classList.contains('zoomed'),
    unzoom: () => zoom(false),
  }
})

document.addEventListener('keydown', (event) => {
  if (!blog.classList.contains('single')) return
  const gallery = galleries.find((g) => g.post.classList.contains('active'))
  if (event.key === 'Escape') return gallery && gallery.zoomed() ? gallery.unzoom() : go('/blog')
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
  if (gallery) gallery.step(event.key === 'ArrowLeft' ? -1 : 1)
})

if (!routeBlog() && project) {
  const element = document.querySelector(`#${project}`)
  element.scrollIntoView()
  open(element)
}

function open(element) {
  const url = element.getAttribute('data-url')

  if (document.body.classList.contains('blog')) setBlog(false)

  if (element.classList.contains('show') || url === null) {
    right.style.display = 'none'
    frame.src = ''
    window.history.pushState({}, '', '/')
  } else {
    right.style.display = 'block'
    frame.src = url
    window.history.pushState({}, '', `/?project=${element.id}`)
  }

  if (url) {
    projs.forEach((e) => (e !== element ? e.classList.remove('show') : console.log('cool')))
    element.classList.toggle('show')
  }
}

function ccc(path) {
  if (path) {
    if (path.endsWith('.mp4')) {
      c.innerHTML = `<video src="/assets/${path}" muted loop autoplay></video>`
    } else {
      c.innerHTML = `<img src="/assets/${path}">`
    }
    c.style.display = 'block'
  } else {
    c.style.display = 'none'
  }
}

document.addEventListener('mousemove', (event) => {
  c.style.left = `${event.clientX + 15}px`
  c.style.top = `${event.clientY + 15}px`
})

bio.addEventListener('mouseenter', (event) => {
  ccc('bio-gcc.jpg')
})

bio.addEventListener('mouseleave', (event) => {
  ccc()
})

// on phones the preview panel is hidden: a project with a "⇝ www" link goes
// straight to that website instead
const phone = window.matchMedia('(max-width: 450px)')

function wwwLink(element) {
  return [].slice.call(element.querySelectorAll('p a')).find((a) => a.textContent.trim() === 'www') || null
}

projs.forEach((element) => {
  element.addEventListener('click', function (event) {
    const www = wwwLink(this)
    if (phone.matches && www && !event.target.closest('a')) {
      window.location.href = www.href
      return
    }
    open(this)
  })

  element.addEventListener('mouseenter', (event) => {
    const path = element.getAttribute('data-visual')
    ccc(path)
  })

  element.addEventListener('mouseleave', (event) => {
    ccc()
  })
})

// footer lists: measure the tallest list so the CSS hover state can size to it
const down = document.querySelector('.left .down')

function measureDown() {
  // lay the lists out at the hover width with natural height, read, restore (no paint in between)
  down.classList.add('measure')
  const lists = [].slice.call(down.querySelectorAll('ul'))
  const fit = Math.max(...lists.map((ul) => ul.scrollHeight))
  down.classList.remove('measure')
  down.style.setProperty('--down-fit', `${fit}px`)
  down.style.setProperty('--contact-w', `${down.querySelector('div').offsetWidth}px`)
}

measureDown()
window.addEventListener('resize', measureDown)
document.fonts.ready.then(measureDown)

// open/close the footer instantly (no animation: the 100em glow shadows make
// any animated resize repaint too slowly)
function setDownOpen(open) {
  down.classList.toggle('open', open)
}

down.addEventListener('mouseenter', () => setDownOpen(true))
down.addEventListener('mouseleave', () => setDownOpen(false))
// moving straight onto the preview iframe (or out of the window) may not fire
// mouseleave; mouseout does, with a relatedTarget outside .down (or null)
down.addEventListener('mouseout', (event) => {
  if (!down.contains(event.relatedTarget)) setDownOpen(false)
})
