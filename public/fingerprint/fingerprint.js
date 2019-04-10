const img = document.getElementById('img')
const p = document.getElementById('p')
const button = document.getElementById('button')

let fingerprint

button.addEventListener('click', () => {
  navigator.clipboard.writeText(fingerprint.filter(entry => entry.key === 'canvas')[0].value[1].replace('canvas fp:', ''))
})

function init () {
  Fingerprint2.get(components => {
    fingerprint = components
    console.log(fingerprint)
    const canvas = components.filter(entry => entry.key === 'canvas')[0].value[1].replace('canvas fp:', '')
    const webgl = components.filter(entry => entry.key === 'webgl')[0].value[0]

    img.src = canvas
    p.innerText = canvas
  })
}

requestIdleCallback(() => {
  init()
})
