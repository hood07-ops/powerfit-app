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

// Each independent client deliberately reuses id=1. The SDK security update must
// remain compatible with the per-request server factory used by createMcpHandler.
const independentResponses = await Promise.all(Array.from({ length: 3 }, async (_, index) => {
  const independentRequest = new Request('http://localhost/api/mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ ...body, params: { ...body.params, clientInfo: { name: `powerfit-ci-${index}`, version: '1.0.0' } } }),
  })
  const independentResponse = await POST(independentRequest)
  if (!independentResponse.ok) throw new Error(`MCP independent client ${index} failed: ${independentResponse.status}`)
  return independentResponse.text()
}))
if (!independentResponses.every((value) => value.includes('"result"'))) throw new Error('MCP independent-client initialization returned an unexpected result.')
console.log('MCP independent clients smoke test passed.')
