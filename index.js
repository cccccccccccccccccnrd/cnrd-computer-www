const path = require('path')
const express = require('express')
const WebSocket = require('ws')

let state = {}

const app = express()

app.use('/', express.static(path.join(__dirname, 'public')))

// /blog and /blog/<post-id> are the main page in blog mode (main.js reads the path)
app.get(['/blog', '/blog/:post'], (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')))

// local editing of text posts, only with BLOG_EDIT=1 (npm run dev). Never set
// on the server: there every request arrives from nginx on localhost, so this
// switch is what keeps the route off the live site
if (process.env.BLOG_EDIT === '1') {
  const fs = require('fs')
  const { execFile } = require('child_process')
  const blogDir = path.join(__dirname, 'public', 'assets', 'blog')
  const manifest = path.join(__dirname, 'blog.json')
  let building = Promise.resolve()

  app.get('/__blog-edit', (req, res) => res.json({ edit: true }))

  // body: { time, text } -> writes the post's .txt file, then rebuilds the blog
  app.post('/__blog-edit', express.json({ limit: '1mb' }), (req, res) => {
    const { time, text } = req.body || {}
    const post = JSON.parse(fs.readFileSync(manifest, 'utf8')).posts.find((p) => String(p.time) === String(time))
    if (!post || !/\.txt$/i.test(post.path) || typeof text !== 'string') return res.status(400).json({ error: 'not a text post' })
    fs.writeFileSync(path.join(blogDir, post.path), text.endsWith('\n') ? text : text + '\n')
    building = building.then(
      () => new Promise((done) => execFile(process.execPath, [path.join(__dirname, 'build-blog.js')], () => done()))
    )
    building.then(() => res.json({ saved: post.path }))
  })

  console.log('blog editing on: text posts are editable in the browser')
}

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

  ws.on('message', function incoming(raw) {
    const data = raw.toString()

    try {
      state = JSON.parse(data)
    } catch (e) {
      return
    }

    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data)
      }
    })
  }) 
})
