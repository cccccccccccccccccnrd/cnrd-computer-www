const path = require('path')
const express = require('express')
const WebSocket = require('ws')

let state = {}

const app = express()

app.use('/', express.static(path.join(__dirname, 'public')))

app.listen(2000)
console.log('WWW listening on http://localhost:2000')

const wss = new WebSocket.Server({ port: 2001 })

wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data)
    }
  })
} 

wss.on('connection', function connection(ws) {

  ws.send(JSON.stringify(state))

  ws.on('message', function incoming(data) {

    state = JSON.parse(data)

    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data)
      }
    }) 
  }) 
})
