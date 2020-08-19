console.log(`%c:---)`, 'padding: 5px; background: blue; color: white;')

const project = new URLSearchParams(window.location.search).get('project')

if (project) {
  open(project)
}

function open (project) {
  document.querySelector(`#${ project }`).classList.toggle('show')
  window.history.pushState({}, {}, '/')
}

const name = document.querySelector('#name')
const conrad = document.querySelector('#conrad')
const projs = [].slice.call(document.querySelectorAll('.proj'))
const switchh = document.querySelector('#switch')

switchh.addEventListener('click', (event) => {
  switchh.classList.toggle('active')
  projs.forEach((element) => {
    element.classList.toggle('show')
  })
})

document.addEventListener('mousemove', (event) => {
  if (event.target.id === 'name') {
    conrad.style.left = `${ event.clientX + 15 }px`
    conrad.style.top = `${ event.clientY + 15 }px`
  }
})

name.addEventListener('mouseenter', (event) => {
  conrad.style.display = 'block'
})

name.addEventListener('mouseleave', (event) => {
  conrad.style.display = 'none'
})

projs.forEach((element) => {
  element.addEventListener('click', function () {
    this.classList.toggle('show')
  })
})
