console.log(`%c:---)`, 'padding: 5px; background: blue; color: white;')

const name = document.querySelector('#name')
const cnrd = document.querySelector('#cnrd')
const projs = [].slice.call(document.querySelectorAll('.proj'))
const switchh = document.querySelector('#switch')
const project = new URLSearchParams(window.location.search).get('project')

if (project) {
  open(project)
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

switchh.addEventListener('click', (event) => {
  switchh.classList.toggle('active')
  projs.forEach((element) => {
    element.classList.toggle('show')
  })
})

document.addEventListener('mousemove', (event) => {
  if (event.target.id === 'name') {
    cnrd.style.left = `${ event.clientX + 15 }px`
    cnrd.style.top = `${ event.clientY + 15 }px`
  }
})

name.addEventListener('mouseenter', (event) => {
  cnrd.style.display = 'block'
})

name.addEventListener('mouseleave', (event) => {
  cnrd.style.display = 'none'
})

projs.forEach((element) => {
  element.addEventListener('click', function () {
    this.classList.toggle('show')
  })
})
