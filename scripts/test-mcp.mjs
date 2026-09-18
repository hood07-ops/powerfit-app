import { POST } from '../api/mcp.ts'

const body = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'powerfit-ci', version: '1.0.0' },
  },
}

const request = new Request('http://localhost/api/mcp', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    accept: 'application/json, text/event-stream',
  },
  body: JSON.stringify(body),
})

const response = await POST(request)
if (!response.ok) {
  throw new Error(`MCP initialize failed: ${response.status} ${await response.text()}`)
}

const text = await response.text()
if (!text.includes('powerfit-cps-dastan') && !text.includes('"result"')) {
  throw new Error(`Unexpected MCP response: ${text.slice(0, 500)}`)
}

console.log('MCP initialize smoke test passed.')
