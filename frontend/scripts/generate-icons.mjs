// scripts/generate-icons.mjs
// Gera todos os ícones PNG necessários para a PWA a partir do SVG
// Executar: node scripts/generate-icons.mjs

import { execSync } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const iconSvg = join(root, 'public', 'icon.svg')
const iconsDir = join(root, 'public', 'icons')

if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true })

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

// Verifica se sharp está disponível
try {
  const sharp = await import('sharp')
  const svg = (await import('fs')).readFileSync(iconSvg)

  for (const size of sizes) {
    const out = join(iconsDir, `icon-${size}.png`)
    await sharp.default(svg).resize(size, size).png().toFile(out)
    console.log(`✅ icon-${size}.png gerado`)
  }
  console.log('\n🎉 Todos os ícones PWA gerados com sucesso em public/icons/')
} catch {
  console.log('\n📦 Sharp não encontrado. Gerando ícones via canvas HTML...')
  console.log('Execute: npm install sharp --save-dev && node scripts/generate-icons.mjs')
  console.log('\nAlternativamente, use https://realfavicongenerator.net com o arquivo public/icon.svg')
}
