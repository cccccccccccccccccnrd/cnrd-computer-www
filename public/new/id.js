let id

document.querySelector('#button').addEventListener('click', () => {
  window.open(`https://www.youtube.com/watch?v=${id}`, '_blank')
})

function getId () {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'
  return Array.apply(null, { length: 11 }).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('')
}

function generate () {
  id = getId()
  document.querySelector('#id').innerText = id
}

generate()