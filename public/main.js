console.log(`%c:---)`, 'padding: 5px; background: blue; color: white;')

const bio = document.querySelector('#bio')
const c = document.querySelector('#c')
const frame = document.querySelector('#frame')
const right = document.querySelector('#right')
const projs = [].slice.call(document.querySelectorAll('.proj'))
const project = new URLSearchParams(window.location.search).get('project')

if (project) {
  const element = document.querySelector(`#${project}`)
  element.scrollIntoView()
  open(element)
}

function open(element) {
  const url = element.getAttribute('data-url')

  if (element.classList.contains('show') || url === null) {
    right.style.display = 'none'
    frame.src = ''
    window.history.pushState({}, {}, '/')
  } else {
    right.style.display = 'block'
    frame.src = url
    window.history.pushState({}, {}, `?project=${element.id}`)
  }

  if (url) {
    projs.forEach((e) => (e !== element ? e.classList.remove('show') : console.log('cool')))
    element.classList.toggle('show')
  }
}

function ccc(path) {
  if (path) {
    if (path.endsWith('.mp4')) {
      c.innerHTML = `<video src="assets/${path}" muted loop autoplay></video>`
    } else {
      c.innerHTML = `<img src="assets/${path}">`
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
  ccc('conrad.png')
})

bio.addEventListener('mouseleave', (event) => {
  ccc()
})

projs.forEach((element) => {
  element.addEventListener('click', function () {
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
