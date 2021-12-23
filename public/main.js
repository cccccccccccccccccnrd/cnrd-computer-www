console.log(`%c:---)`, 'padding: 5px; background: blue; color: white;')

const name = document.querySelector('#name')
const c = document.querySelector('#c')
const cImg = document.querySelector('#c-img')
const projs = [].slice.call(document.querySelectorAll('.proj'))
const project = new URLSearchParams(window.location.search).get('project')

if (project) {
  open(project)
}

function ccc (path) {
  if (path) {
    c.style.display = 'block'
    cImg.src = `assets/${path}`
  } else {
    c.style.display = 'none'
  }
}

function open (project) {
  const element = document.querySelector(`#${ project }`)

  if (element) {
    element.classList.toggle('show')
  } else {
    switchh.classList.toggle('active')
    projs.forEach((element) => {
      element.classList.toggle('show')
    })
  }
  
  window.history.pushState({}, {}, '/')
}

document.addEventListener('mousemove', (event) => {
  if (event.target.id === 'name') {
    c.style.left = `${ event.clientX + 15 }px`
    c.style.top = `${ event.clientY + 15 }px`
  }
})

name.addEventListener('mouseenter', (event) => {
  ccc('conrad.png')
})

name.addEventListener('mouseleave', (event) => {
  ccc()
})

projs.forEach((element) => {
  element.addEventListener('click', function () {
    this.classList.toggle('show')
  })
})
