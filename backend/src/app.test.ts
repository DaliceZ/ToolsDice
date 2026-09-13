import { describe, expect, it } from 'bun:test'
import { createApp } from './application'
import vercelApp from './index'

describe('API', () => {
  it('exports a working Elysia entry point for Vercel', async () => {
    const response = await vercelApp.handle(new Request('http://localhost/api/v1/health'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.status).toBe('ok')
  })

  it('returns the health envelope and security headers', async () => {
    const response = await createApp().handle(new Request('http://localhost/api/v1/health'))
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(body.data.status).toBe('ok')
    expect(body.error).toBeNull()
    expect(body.requestId).toBeString()
  })

  it('returns all enabled tools', async () => {
    const response = await createApp().handle(new Request('http://localhost/api/v1/config'))
    const body = await response.json()
    expect(body.data.enabledToolIds).toHaveLength(52)
    expect(body.data.maxLocalFileBytes).toBeGreaterThan(0)
  })
})
