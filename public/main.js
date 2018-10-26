const ws = new WebSocket('ws://cnrd.computer:2001')

let state = {}

ws.onmessage = event => {
  console.log(event.data)
  const newState = JSON.parse(event.data)
  console.log(newState)
  state = newState

  setState()
}

function sendState() {
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
  const id = event.srcElement.id
  const x = event.x
  const y = event.y

  if (x > 0 && y > 0) state[id] = { x, y }

  setState()
  sendState()
}

function preventDragImage (event) {
  const img = new Image()
  img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
  event.dataTransfer.setDragImage(img, 10, 10)
}
