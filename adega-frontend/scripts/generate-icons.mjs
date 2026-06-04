import sharp from 'sharp'

const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#1a1a2e"/>
  <text x="256" y="340" font-family="Arial" font-size="300" font-weight="bold"
    text-anchor="middle" fill="#ffffff">A</text>
</svg>`)

await sharp(svg).resize(192, 192).png().toFile('public/pwa-192x192.png')
await sharp(svg).resize(512, 512).png().toFile('public/pwa-512x512.png')
console.log('Icons generated: pwa-192x192.png and pwa-512x512.png')
