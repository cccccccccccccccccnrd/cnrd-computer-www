console.log(`%c:---)`, 'padding: 5px; background: blue; color: white;')

const name = document.getElementById('name')
const conrad = document.getElementById('conrad')
const buttons = [].slice.call(document.getElementsByClassName('button'))

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

buttons.forEach(element => {
  element.addEventListener('click', function () {
    this.classList.toggle('show')
  })
})
