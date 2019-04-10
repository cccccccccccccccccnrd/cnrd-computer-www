const img = document.getElementById('img')
const p = document.getElementById('p')
const copy = document.getElementById('copy')
const download = document.getElementById('download')

let fingerprint

download.addEventListener('click', () => {
  const canvas = fingerprint.filter(entry => entry.key === 'canvas')[0].value[1].replace('canvas fp:', '')

  const a = document.createElement('a')
  a.download = `canvas-fingerprint-${ canvas.substring(100, 110) }.txt`
  const blob = new Blob([canvas], { type: 'text/plain' })
  a.href = window.URL.createObjectURL(blob)
  document.body.appendChild(a)
  a.click()
})

copy.addEventListener('click', () => {
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
