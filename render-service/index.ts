import cors from 'cors'
import express, { type Request, type Response } from 'express'
import path from 'node:path'
import { bundle } from '@remotion/bundler'
import { getCompositions, renderMedia } from '@remotion/renderer'
import type { RenderGroup } from '../src/types'

type RenderRequestBody = {
  groups: RenderGroup[]
}

const app = express()
const port = Number(process.env.PORT || 8080)
const rootDir = path.resolve(__dirname, '..')
const entryPoint = path.join(rootDir, 'src', 'remotion', 'render-entry.tsx')
const publicDir = path.join(rootDir, 'public')

let bundlePromise: Promise<string> | null = null

const getServeUrl = () => {
  if (!bundlePromise) {
    bundlePromise = bundle({
      entryPoint,
      publicDir,
      webpackOverride: (config) => config,
    })
  }

  return bundlePromise
}

app.use(cors())
app.use(express.json({ limit: '4mb' }))

app.get('/health', (_request: Request, response: Response) => {
  response.json({ ok: true })
})

app.post('/render', async (request: Request, response: Response) => {
  const body = request.body as RenderRequestBody

  if (!body?.groups?.length) {
    response.status(400).json({ error: 'Envie ao menos um grupo para gerar o video.' })
    return
  }

  try {
    const serveUrl = await getServeUrl()
    const inputProps = { groups: body.groups }
    const compositions = await getCompositions(serveUrl, { inputProps })
    const composition = compositions.find((item) => item.id === 'MatchReelVideo')

    if (!composition) {
      throw new Error('Composicao MatchReelVideo nao encontrada.')
    }

    const outputLocation = path.join('/tmp', `match-reel-${Date.now()}.mp4`)

    await renderMedia({
      serveUrl,
      composition,
      codec: 'h264',
      outputLocation,
      inputProps,
    })

    response.setHeader('Content-Type', 'video/mp4')
    response.setHeader('Content-Disposition', 'attachment; filename="reel.mp4"')
    response.sendFile(outputLocation, (error: Error | undefined) => {
      if (error) {
        console.error('sendFile error', error)
      }
    })
  } catch (error) {
    console.error(error)
    response.status(500).json({
      error: 'Nao foi possivel gerar o video.',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
    })
  }
})

app.listen(port, () => {
  console.log(`Render service listening on ${port}`)
})
