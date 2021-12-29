console.log(`%c:---)`, 'padding: 5px; background: blue; color: white;')

const name = document.querySelector('#name')
const c = document.querySelector('#c')
const frame = document.querySelector('#frame')
const right = document.querySelector('#right')
const projs = [].slice.call(document.querySelectorAll('.proj'))
const project = new URLSearchParams(window.location.search).get('project')

if (project) {
  open(project)
}

function ccc (path) {
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

function open (project) {
  const element = document.querySelector(`#${ project }`)

  if (element) {
    element.classList.toggle('show')
  } else {
    projs.forEach((element) => {
      element.classList.toggle('show')
    })
  }
  
  window.history.pushState({}, {}, '/')
}

document.addEventListener('mousemove', (event) => {
  c.style.left = `${ event.clientX + 15 }px`
  c.style.top = `${ event.clientY + 15 }px`
})

name.addEventListener('mouseenter', (event) => {
  ccc('conrad.png')
})

name.addEventListener('mouseleave', (event) => {
  ccc()
})

projs.forEach((element) => {
  element.addEventListener('click', function () {
    const url = element.getAttribute('data-url')
    console.log(url)

    if (this.classList.contains('show') || url === null) {
      right.style.display = 'none'
      frame.src = ''
    } else {
      right.style.display = 'block'
      frame.src = url
    }
    
    if (url) {
      projs.forEach((e) => e !== this ? e.classList.remove('show') : console.log('cool'))
      this.classList.toggle('show')
    }
  })

  element.addEventListener('mouseenter', (event) => {
    const path = element.getAttribute('data-visual')
    ccc(path)
  })
  
  element.addEventListener('mouseleave', (event) => {
    ccc()
  })
})
