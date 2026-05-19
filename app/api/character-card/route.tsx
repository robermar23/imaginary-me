/**
 * @fileoverview POST /api/character-card — renders a 1200×675 Character Card PNG
 * server-side via Satori (JSX→SVG) + @resvg/resvg-js (SVG→PNG) and returns it
 * as a direct file download.
 *
 * Node.js runtime only (not Edge) — @resvg/resvg-js uses native binaries.
 */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { NextRequest } from 'next/server'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import type { CharacterCardRequest } from '@/types'

export const dynamic = 'force-dynamic'

// ── Font cache (module-level) ─────────────────────────────────────────────────

interface FontData {
  readonly regular: ArrayBuffer
  readonly bold: ArrayBuffer
}

let fontCache: FontData | null = null

/**
 * Loads Inter Regular and Bold from rsms.me CDN, caching in module scope.
 * First request takes ~200ms; subsequent requests are instant.
 * @returns Loaded font ArrayBuffers for both weights.
 */
async function loadFonts(): Promise<FontData> {
  if (fontCache) return fontCache
  const fontsDir = join(process.cwd(), 'node_modules', '@fontsource', 'inter', 'files')
  const [regularBuf, boldBuf] = await Promise.all([
    readFile(join(fontsDir, 'inter-latin-400-normal.woff2')),
    readFile(join(fontsDir, 'inter-latin-700-normal.woff2')),
  ])
  // Buffer may use a shared pool — slice to an owned ArrayBuffer
  const toArrayBuffer = (buf: Buffer): ArrayBuffer =>
    buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
  fontCache = { regular: toArrayBuffer(regularBuf), bold: toArrayBuffer(boldBuf) }
  return fontCache
}

// ── Input validation ──────────────────────────────────────────────────────────

function validateRequest(body: unknown): body is CharacterCardRequest {
  if (!body || typeof body !== 'object') return false
  const b = body as Record<string, unknown>
  if (typeof b.imageUrl !== 'string' || !b.imageUrl) return false
  if (typeof b.title !== 'string' || !b.title) return false
  if (typeof b.backstory !== 'string' || !b.backstory) return false
  if (!Array.isArray(b.interestTags)) return false
  if (typeof b.artStyle !== 'string' || !b.artStyle) return false
  return true
}

// ── Image helpers ─────────────────────────────────────────────────────────────

/**
 * Fetches an image and returns it as a base64 data URL for Satori embedding.
 * @param url - Image URL (Vercel Blob, data URL, or any accessible URL).
 * @returns Base64-encoded data URL.
 */
async function imageToDataUrl(url: string): Promise<string> {
  if (url.startsWith('data:')) return url
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch portrait image: ${res.status}`)
  const ab = await res.arrayBuffer()
  const mime = res.headers.get('content-type') ?? 'image/png'
  const b64 = Buffer.from(ab).toString('base64')
  return `data:${mime};base64,${b64}`
}

/**
 * Converts a title to a URL-safe filename slug.
 * @param title - The character title.
 * @returns A lowercase hyphenated slug, max 60 chars.
 */
function toSlug(title: string): string {
  return title
    .replace(/[^a-z0-9]+/gi, '-')
    .toLowerCase()
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'character'
}

// ── Card JSX ──────────────────────────────────────────────────────────────────
// Satori-compatible layout: flex only, hex/rgb colors, no CSS variables.
// Images embedded as base64 data URLs.

function buildCardElement(
  imageDataUrl: string,
  title: string,
  backstory: string,
  interestTags: readonly string[],
  artStyle: string,
): React.ReactElement {
  const tags = interestTags.slice(0, 3)

  return (
    <div
      style={{
        display: 'flex',
        width: 1200,
        height: 675,
        backgroundColor: '#0a0a0f',
        fontFamily: 'Inter',
      }}
    >
      {/* Left panel: violet border strip + portrait image */}
      <div style={{ display: 'flex', width: 600, height: 675, flexShrink: 0 }}>
        {/* 4px violet left accent bar */}
        <div
          style={{
            width: 4,
            height: 675,
            backgroundColor: '#6c47ff',
            flexShrink: 0,
          }}
        />
        {/* Portrait image fills the rest of the left panel */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageDataUrl}
          alt=""
          width={596}
          height={675}
          style={{ width: 596, height: 675, objectFit: 'cover' }}
        />
      </div>

      {/* Right panel: character text content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: 600,
          height: 675,
          paddingTop: 40,
          paddingBottom: 32,
          paddingLeft: 40,
          paddingRight: 40,
        }}
      >
        {/* Header row: "CHARACTER LORE" label + watermark */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 400,
              color: '#00d4ff',
              letterSpacing: 2,
            }}
          >
            CHARACTER LORE
          </span>
          <span style={{ fontSize: 10, fontWeight: 400, color: '#2a2a3d' }}>
            imaginary-me
          </span>
        </div>

        {/* Character title */}
        <div
          style={{
            fontSize: 21,
            fontWeight: 700,
            color: '#f0f0f8',
            lineHeight: 1.25,
            marginBottom: 20,
          }}
        >
          {title.toUpperCase()}
        </div>

        {/* Backstory text — fills remaining vertical space */}
        <div
          style={{
            fontSize: 14,
            fontWeight: 400,
            color: '#8888aa',
            lineHeight: 1.65,
            flex: 1,
          }}
        >
          {backstory}
        </div>

        {/* Interest tags + art style badge */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 20,
          }}
        >
          {tags.map((tag, i) => (
            <div
              key={i}
              style={{
                backgroundColor: '#12121a',
                borderRadius: 4,
                paddingTop: 4,
                paddingBottom: 4,
                paddingLeft: 10,
                paddingRight: 10,
                fontSize: 11,
                fontWeight: 400,
                color: '#8888aa',
              }}
            >
              {tag}
            </div>
          ))}
          {/* Art style badge — violet tint to distinguish */}
          <div
            style={{
              backgroundColor: '#12121a',
              borderRadius: 4,
              paddingTop: 4,
              paddingBottom: 4,
              paddingLeft: 10,
              paddingRight: 10,
              fontSize: 11,
              fontWeight: 400,
              color: '#6c47ff',
            }}
          >
            {artStyle}
          </div>
        </div>

        {/* Bottom watermark */}
        <div
          style={{
            fontSize: 10,
            fontWeight: 400,
            color: '#2a2a3d',
            textAlign: 'right',
          }}
        >
          generated with imaginary-me
        </div>
      </div>
    </div>
  )
}

// ── Route handler ─────────────────────────────────────────────────────────────

/**
 * POST /api/character-card
 * Accepts CharacterCardRequest JSON, returns a 1200×675 PNG as a file download.
 * @param request - Incoming Next.js request.
 * @returns PNG binary response or JSON error.
 */
export async function POST(request: NextRequest): Promise<Response> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!validateRequest(body)) {
    return Response.json({ error: 'Invalid request parameters' }, { status: 400 })
  }

  const { imageUrl, title, backstory, interestTags, artStyle } = body

  try {
    const [fonts, imageDataUrl] = await Promise.all([
      loadFonts(),
      imageToDataUrl(imageUrl),
    ])

    const element = buildCardElement(imageDataUrl, title, backstory, interestTags, artStyle)

    const svg = await satori(element, {
      width: 1200,
      height: 675,
      fonts: [
        { name: 'Inter', data: fonts.regular, weight: 400, style: 'normal' },
        { name: 'Inter', data: fonts.bold, weight: 700, style: 'normal' },
      ],
    })

    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } })
    const rendered = resvg.render()
    // asPng() returns a Node.js Buffer — wrap in Uint8Array so Response accepts it
    const pngBuffer = new Uint8Array(rendered.asPng())

    const filename = `${toSlug(title)}-character-card.png`

    return new Response(pngBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[character-card] render error:', err)
    return Response.json({ error: 'Character card generation failed' }, { status: 500 })
  }
}
