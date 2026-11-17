// Builds the blog section of public/index.html from the folder public/assets/blog/.
//
//   npm run blog
//
// What goes in the folder:
//   picture or video (jpg, png, gif, webp, avif, mp4, webm, mov)  -> a post with that one item, no caption, not clickable
//   .txt file                                                      -> a text post, renamed to <unix time>.txt (blank lines separate paragraphs,
//                                                                     [text](https://…) for links), /blog/<unix time>
//   folder                                                         -> a collection: its pictures/videos in filename order,
//                                                                     plus any .txt in it as text, at /blog/<folder-name>.
//                                                                     The feed shows only its cover picture
//
// It also writes the RSS feed public/rss.xml (https://cnrd.computer/rss.xml).
//
// Posts keep the order they were added in; the feed shows the newest first. blog.json (next to
// this script) remembers that order and per post its "time" (unix seconds, the file's creation
// time when it was first built; unique per post), so a rebuild or a fresh clone keeps both. New
// files are appended in the order of their creation date. A post's label is "DD.MM.YYYY, <time>"
// and its permalink /blog/<time>. In blog.json you can also set, per post: "date" (replaces the
// DD.MM.YYYY), "caption" (replaces the whole label) and, for a folder, "cover" (which picture the
// feed shows, 1-based, default 1).

const fs = require('fs')
const path = require('path')

const ROOT = __dirname
const FOLDER = path.join(ROOT, 'public', 'assets', 'blog')
const URL_BASE = '/assets/blog'
const MANIFEST = path.join(ROOT, 'blog.json')
const INDEX = path.join(ROOT, 'public', 'index.html')
const FEED = path.join(ROOT, 'public', 'rss.xml')
const SITE = 'https://cnrd.computer'
const START = '<!-- blog:start -->'
const END = '<!-- blog:end -->'

const IMAGE = /\.(jpe?g|png|gif|webp|avif)$/i
const VIDEO = /\.(mp4|webm|mov|m4v)$/i
const TEXT = /\.txt$/i

const visible = (name) => !name.startsWith('.')

function kind(full) {
  const name = path.basename(full)
  if (fs.statSync(full).isDirectory()) return 'collection'
  if (IMAGE.test(name)) return 'image'
  if (VIDEO.test(name)) return 'video'
  if (TEXT.test(name)) return 'text'
  return null
}

function added(full) {
  const stat = fs.statSync(full)
  return stat.birthtimeMs || stat.mtimeMs
}

function dayMonthYear(seconds) {
  const d = new Date(seconds * 1000)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

const escape = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const url = (...parts) => [URL_BASE, ...parts.map(encodeURIComponent)].join('/')

// "slug" for a folder name: used as the post's id, so /blog/<slug>
const slug = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

function paragraphs(text) {
  return text
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      // [text](https://…) becomes a link on "text"; other bare URLs link to themselves
      const links = []
      const html = escape(p)
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (m, text, href) => {
          links.push(`<a href="${href}" target="_blank">${text}</a>`)
          return `\u0000${links.length - 1}\u0000`
        })
        .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank">$1</a>')
        .replace(/\u0000(\d+)\u0000/g, (m, i) => links[i])
        .replace(/\n/g, '<br />')
      return `<p>${html}</p>`
    })
}

function media(src, type, eager, cover, i, total) {
  const alt = total > 1 ? ` alt="${i + 1}/${total}"` : ' alt=""'
  const cls = cover ? ' class="cover"' : ''
  if (type === 'video') return `<video${cls} src="${src}" muted loop autoplay playsinline preload="metadata"></video>`
  return `<img${cls} src="${src}"${alt}${eager ? '' : ' loading="lazy"'} />`
}

// ---- rss helpers

const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', avif: 'image/avif', mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime' }
const mime = (name) => MIME[name.split('.').pop().toLowerCase()] || 'application/octet-stream'

// a text post has no title: use its first words, without [link](url) syntax
function firstWords(text, max = 60) {
  const plain = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1').replace(/\s+/g, ' ').trim()
  if (plain.length <= max) return plain
  return plain.slice(0, plain.lastIndexOf(' ', max) > 20 ? plain.lastIndexOf(' ', max) : max) + '…'
}

const cdata = (html) => `<![CDATA[${html.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`

function rss(items) {
  const entries = items.map((item) => {
    const guid = item.permalink
      ? `<guid isPermaLink="true">${escape(item.link)}</guid>`
      : `<guid isPermaLink="false">${escape(item.guid)}</guid>`
    const enclosure = item.enclosure
      ? `\n      <enclosure url="${escape(item.enclosure.url)}" length="${item.enclosure.length}" type="${item.enclosure.type}" />`
      : ''
    return `    <item>
      <title>${escape(item.title)}</title>
      <link>${escape(item.link)}</link>
      ${guid}
      <pubDate>${new Date(item.time * 1000).toUTCString()}</pubDate>
      <description>${cdata(item.html)}</description>${enclosure}
    </item>`
  })
  const latest = items.reduce((t, item) => Math.max(t, item.time), 0)
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>cnrd blog</title>
    <link>${SITE}/blog</link>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />
    <description>pictures, galleries and notes from cnrd.computer</description>
    <lastBuildDate>${new Date(latest * 1000).toUTCString()}</lastBuildDate>
${entries.join('\n')}
  </channel>
</rss>
`
}

// ---- order: blog.json + new files

const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : { posts: [] }
const present = fs
  .readdirSync(FOLDER)
  .filter(visible)
  .filter((name) => kind(path.join(FOLDER, name)))

const known = new Set(manifest.posts.map((p) => p.path))
const removed = manifest.posts.filter((p) => !present.includes(p.path)).map((p) => p.path)
manifest.posts = manifest.posts.filter((p) => present.includes(p.path))

const fresh = present
  .filter((name) => !known.has(name))
  .map((name) => ({ name, at: added(path.join(FOLDER, name)) }))
  // same second (e.g. copied together): by name
  .sort((a, b) => Math.floor(a.at / 1000) - Math.floor(b.at / 1000) || a.name.localeCompare(b.name, undefined, { numeric: true }))
const times = new Set(manifest.posts.map((p) => p.time))
fresh.forEach(({ name, at }) => {
  let time = Math.floor(at / 1000)
  while (times.has(time) || (TEXT.test(name) && name !== `${time}.txt` && fs.existsSync(path.join(FOLDER, `${time}.txt`)))) time += 1
  times.add(time)
  // a new .txt is renamed to its timestamp: <time>.txt
  let file = name
  if (TEXT.test(name) && name !== `${time}.txt`) {
    file = `${time}.txt`
    fs.renameSync(path.join(FOLDER, name), path.join(FOLDER, file))
  }
  manifest.posts.push({ path: file, time })
})

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n')

// ---- html, newest first

const ids = new Set()
const feedItems = [] // filled alongside the html, newest first
const articles = manifest.posts
  .slice()
  .reverse()
  .map((post) => {
    const full = path.join(FOLDER, post.path)
    const type = kind(full)
    const date = ` data-time="${post.time}" data-date="${escape(post.date || dayMonthYear(post.time))}"`
    const caption = post.caption ? escape(post.caption) : ''

    if (type === 'text') {
      const source = fs.readFileSync(full, 'utf8')
      const body = paragraphs(source).join('\n          ')
      feedItems.push({
        title: firstWords(source),
        link: `${SITE}/blog/${post.time}`,
        permalink: true,
        time: post.time,
        html: paragraphs(source).join('\n'),
      })
      return `        <article class="post text"${date}>\n          <div class="body">\n            ${body.replace(/\n          /g, '\n            ')}\n          </div>\n        </article>`
    }

    let items = []
    let text = []
    let id = ''
    if (type === 'collection') {
      const names = fs
        .readdirSync(full)
        .filter(visible)
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      items = names
        .filter((n) => IMAGE.test(n) || VIDEO.test(n))
        .map((n) => ({ src: url(post.path, n), type: VIDEO.test(n) ? 'video' : 'image' }))
      text = names.filter((n) => TEXT.test(n)).flatMap((n) => paragraphs(fs.readFileSync(path.join(full, n), 'utf8')))
      let s = slug(post.path) || 'collection'
      while (ids.has(s) || /^\d+$/.test(s)) s += '-'
      ids.add(s)
      id = ` id="${s}"`
    } else {
      items = [{ src: url(post.path), type }]
    }

    const collection = type === 'collection'
    const cover = collection ? Math.min(Math.max(parseInt(post.cover, 10) || 1, 1), items.length) - 1 : -1
    const slides = items
      .map((m, i) => media(m.src, m.type, i === 0 || i === cover, i === cover, i, items.length))
      .join('\n            ')
    const textHtml = text.length ? `\n          <div class="text">\n            ${text.join('\n            ')}\n          </div>` : ''
    const absolute = (src) => SITE + src
    const mediaHtml = (m) =>
      m.type === 'video' ? `<p><video src="${absolute(m.src)}" controls></video></p>` : `<p><img src="${absolute(m.src)}" /></p>`
    const fileOf = (m) => path.join(FOLDER, ...decodeURIComponent(m.src.slice(URL_BASE.length + 1)).split('/'))
    const enclosure = (m) => ({ url: absolute(m.src), length: fs.statSync(fileOf(m)).size, type: mime(m.src) })

    // a single picture/video: no caption, not clickable
    if (!collection) {
      feedItems.push({
        title: post.caption || post.date || dayMonthYear(post.time),
        link: `${SITE}/blog`,
        guid: absolute(items[0].src),
        time: post.time,
        html: mediaHtml(items[0]),
        enclosure: enclosure(items[0]),
      })
      return `        <article class="post gallery single-item"${date}>
          <div class="slides">
            ${slides}
          </div>
        </article>`
    }
    feedItems.push({
      title: post.caption || `gallery, ${post.date || dayMonthYear(post.time)}`,
      link: `${SITE}/blog/${id.match(/"(.*)"/)[1]}`,
      permalink: true,
      time: post.time,
      html: [mediaHtml(items[cover]), `<p>gallery, ${items.length} items</p>`, ...text].join('\n'),
      enclosure: enclosure(items[cover]),
    })
    // caption and count on top in the feed (on the post's own page they sit at the bottom)
    return `        <article class="post gallery collection"${id}${date}>
          <div class="meta">
            <a class="caption">${caption}</a>
            <span class="count"></span>
          </div>
          <div class="slides">
            ${slides}
          </div>${textHtml}
        </article>`
  })

const html = fs.readFileSync(INDEX, 'utf8')
const a = html.indexOf(START)
const b = html.indexOf(END)
if (a < 0 || b < 0) throw new Error(`markers ${START} / ${END} not found in ${INDEX}`)
const out = html.slice(0, a + START.length) + '\n' + articles.join('\n') + '\n        ' + html.slice(b)
fs.writeFileSync(INDEX, out)
fs.writeFileSync(FEED, rss(feedItems))

console.log(`blog: ${manifest.posts.length} posts (${fresh.length} new${removed.length ? `, removed: ${removed.join(', ')}` : ''})`)
manifest.posts.forEach((p) => console.log(`  ${p.date || dayMonthYear(p.time)}  ${p.time}  ${p.path}`))
