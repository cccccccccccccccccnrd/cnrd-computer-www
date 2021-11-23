function getId () {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'
  return Array.apply(null, { length: 11 }).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('')
}

function generate () {
  const id = getId()
  document.querySelector('#id').innerText = id
}

generate()