import { describe, expect, it } from 'bun:test'
import { createApp } from './app'

describe('API', () => {
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
    expect(body.data.enabledToolIds).toHaveLength(61)
    expect(body.data.maxLocalFileBytes).toBeGreaterThan(0)
  })
})
