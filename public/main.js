const ws = new WebSocket('wss://cnrd.computer/ws')

let state = {}

ws.onmessage = event => {
  const newState = JSON.parse(event.data)
  state = newState

  setState()
}

function random () {
  for (const key in state) {
    if (key === 'hi') return

    const element = document.querySelector(`#${ key }`)
    const width = element.offsetWidth
    const height = element.offsetHeight

    const rx = Math.floor(Math.random() * Math.floor(700))
    const ry = Math.floor(Math.random() * Math.floor(700))

    element.style.left = `${ state[key].rx - width / 2 }px`
    element.style.top = `${ state[key].ry - height / 2 }px`

    state[key].x = rx - width / 2
    state[key].y = ry - width / 2

    setState()
  }

  sendState()
}

function sendState () {
  ws.send(JSON.stringify(state))
}

function setState () {
  for (const key in state) {
    const element = document.querySelector(`#${ key }`)
    const width = element.offsetWidth
    const height = element.offsetHeight

    element.style.left = `${ state[key].x - width / 2 }px`
    element.style.top = `${ state[key].y - height / 2 }px`
  }
}

function drag (event) {
  const id = event.target.id
  const x = event.x
  const y = event.y

  if (x > 0 && y > 0) state[id] = { x, y }

  setState()
  sendState()
}

function dragStart (event) {
  console.log(event.target.id)
  const id = event.target.id
  const img = new Image()
  img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
  event.dataTransfer.setData('text/plain', id)
  event.dataTransfer.setDragImage(img, 10, 10)
}
