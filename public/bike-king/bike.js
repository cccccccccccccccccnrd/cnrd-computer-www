const bike = document.getElementById('bike')
const title = document.getElementById('title')
const button = document.getElementById('button')
const cool = document.getElementById('cool')

function generate () {
  const cy = Math.floor(Math.random() * 70) + 50
  const r = Math.floor(Math.random() * 30) + 5
  const h = Math.floor(Math.random() * 30) + 10

  const dark = `rgb(${ Math.floor(Math.random() * 30) + 1 }, ${ Math.floor(Math.random() * 30) + 1 }, ${ Math.floor(Math.random() * 30) + 1 })`
  const light = `rgb(${ Math.floor(Math.random() * 255) + 150 }, ${ Math.floor(Math.random() * 255) + 150 }, ${ Math.floor(Math.random() * 255) + 150 })`

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="-25 -40 200 200">
      <defs>
        <style>
          .stroke {
            stroke: ${ light } };
          }
        </style>
      </defs>
      <circle class="stroke" cx="26" cy="${ cy }" r="${ r }"/>
      <circle class="stroke" cx="117.73" cy="${ cy }" r="${ r }"/>
      <path d="M62.21 ${ cy }L39.67 2.01" class="stroke"/>
      <path d="M26 ${ cy }h36.21" class="stroke"/>
      <path d="M43.94 12.51L26 ${ cy }" class="stroke"/>
      <path d="M43.94 12.51h57.67" class="stroke"/>
      <path d="M62.21 ${ cy }l42.12-33.49" class="stroke"/>
      <path d="M117.73 ${ cy }l-13.4-33.49" class="stroke"/>
      <path d="M101.61 12.51V7.06" class="stroke"/>
      <path d="M101.61 7.06h${ h }" class="stroke" name="handlebar"/>
      <path d="M32.52 1L51 3.73" class="stroke" name="sattle"/>
      <path d="M101.61 12.51l2.72 ${ cy - 46 }" class="stroke"/>
    </svg>`

  bike.innerHTML = svg
  document.body.style.background = dark
  title.style.fill = light
  button.style.color = light
}

function go () {
  interval = setInterval(() => {
    generate()
  }, 100)
  title.classList.add('rotate')

  setTimeout(() => {
    clearInterval(interval)
    title.classList.remove('rotate')
    setTimeout(() => {
      cool.classList.add('go')
      document.body.classList.add('fade-out')
    }, 1000)
  }, 4000)
}

generate()