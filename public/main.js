const buttons = [].slice.call(document.getElementsByClassName('button'))

buttons.forEach(element => {
  element.addEventListener('click', function () {
    this.classList.toggle('show')
  })
})