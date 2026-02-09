# Proxy Configuration for Bosch LLM Farm

This document explains how to configure the application to work with Bosch's corporate network proxy.

## Problem Overview

When accessing the Bosch LLM Farm API from within the corporate network, requests must go through a local HTTP proxy (typically running on `localhost:3128`). However, Axios (the HTTP client library used in this project) has issues with proxy configurations that cause "Maximum number of redirects exceeded" errors.

## Root Cause

The issue occurs because:
1. **Corporate Proxy Requirement**: The Bosch LLM Farm API (`https://aoai-farm.bosch-temp.com`) requires access through a local proxy
2. **Axios Proxy Bug**: Axios's built-in proxy support doesn't correctly handle HTTPS-over-HTTP proxy tunneling with the Bosch proxy setup
3. **Redirect Loop**: The misconfiguration causes Axios to follow redirects in an infinite loop until hitting the `maxRedirects` limit

## Solution: Tunnel Package

The application uses the `tunnel` npm package instead of Axios's native proxy support. The `tunnel` package correctly implements HTTPS-over-HTTP proxy tunneling.

### Implementation

Both `LlmFarmEmbeddingClient` and `LlmFarmLlmClient` are configured to use the tunnel package:

```typescript
import axios from 'axios';
import * as tunnel from 'tunnel';

// Create HTTPS-over-HTTP tunnel agent
const proxyUrl = process.env.https_proxy || process.env.HTTPS_PROXY;
const httpsAgent = proxyUrl ? tunnel.httpsOverHttp({
  proxy: {
    host: '127.0.0.1',
    port: 3128
  }
}) : undefined;

// Configure Axios client
const client = axios.create({
  baseURL: 'https://aoai-farm.bosch-temp.com/api/...',
  httpsAgent,        // Use tunnel agent
  proxy: false,      // Disable Axios's built-in proxy
  // ... other config
});
```

### Why This Works

- **tunnel Package**: Properly implements HTTP CONNECT tunneling for HTTPS requests
- **Proxy Detection**: Automatically detects the `https_proxy` environment variable
- **Fallback**: When no proxy is set, works directly without tunneling

## Setup Requirements

### 1. Local Proxy

Ensure you have a local proxy running (e.g., Corporate Proxy Tool):
- Host: `127.0.0.1` or `localhost`
- Port: `3128` (default)

### 2. Environment Variables

Set the proxy environment variable (usually done automatically by corporate IT tools):

**macOS/Linux:**
```bash
export https_proxy=http://localhost:3128
export HTTPS_PROXY=http://localhost:3128
```

**Windows:**
```cmd
set https_proxy=http://localhost:3128
set HTTPS_PROXY=http://localhost:3128
```

### 3. NPM Packages

The required packages are already in `package.json`:
```json
{
  "dependencies": {
    "tunnel": "^0.0.6"
  },
  "devDependencies": {
    "@types/tunnel": "^0.0.3"
  }
}
```

Install with:
```bash
npm install
```

## Verification

### Test Proxy Connection with Curl

Verify the proxy is working correctly:

```bash
curl -x 127.0.0.1:3128 \
  -H "genaiplatform-farm-subscription-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"input":["test"]}' \
  "https://aoai-farm.bosch-temp.com/api/openai/deployments/askbosch-prod-farm-openai-text-embedding-3-small/embeddings?api-version=2024-10-21"
```

Expected response: JSON with embedding data (200 OK)

### Test with Node.js

```javascript
const axios = require('axios');
const tunnel = require('tunnel');

const agent = tunnel.httpsOverHttp({
  proxy: { host: '127.0.0.1', port: 3128 }
});

axios.post(
  'https://aoai-farm.bosch-temp.com/api/openai/deployments/askbosch-prod-farm-openai-text-embedding-3-small/embeddings?api-version=2024-10-21',
  { input: ['test'] },
  {
    headers: {
      'genaiplatform-farm-subscription-key': 'YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    httpsAgent: agent,
    proxy: false
  }
).then(response => console.log('SUCCESS:', response.data))
  .catch(error => console.log('ERROR:', error.message));
```

### Test Application Commands

```bash
# Test connection to both services
npm run check-connections

# Generate embeddings (will use proxy automatically)
npm run generate-embeddings
```

## Troubleshooting

### Error: "Maximum number of redirects exceeded"

**Cause**: Axios is using its built-in proxy instead of the tunnel agent

**Solutions**:
1. Verify `proxy: false` is set in Axios config
2. Ensure `httpsAgent` is properly configured with tunnel
3. Check that environment variable `https_proxy` is set

### Error: "ENOTFOUND aoai-farm.bosch-temp.com"

**Cause**: Cannot reach the LLM Farm API (no proxy or wrong proxy config)

**Solutions**:
1. Verify local proxy is running on port 3128
2. Check `https_proxy` environment variable is set
3. Test with curl to verify proxy connectivity

### Error: "connect ECONNREFUSED 127.0.0.1:3128"

**Cause**: Local proxy is not running

**Solutions**:
1. Start your local proxy tool (e.g., Corporate Proxy Tool)
2. Verify it's listening on port 3128: `lsof -i :3128`

### Error: "404 Resource not found"

**Cause**: Incorrect API endpoint URL

**Solutions**:
1. Verify embedding endpoint ends with `/embeddings`
2. Check deployment name matches: `askbosch-prod-farm-openai-text-embedding-3-small`
3. Ensure API version parameter is included: `?api-version=2024-10-21`

## Network Architecture

```
Application (TypeScript/Axios)
    ↓
Tunnel Package (HTTPS-over-HTTP tunneling)
    ↓
Local Proxy (localhost:3128)
    ↓
Corporate Network
    ↓
Bosch LLM Farm (aoai-farm.bosch-temp.com)
```

## Alternative: Direct Connection (Outside Corporate Network)

If accessing from outside the Bosch network (e.g., home, VPN), you may not need the proxy:

1. Unset proxy environment variables:
   ```bash
   unset https_proxy HTTPS_PROXY
   ```

2. The code automatically detects no proxy and connects directly:
   ```typescript
   const httpsAgent = proxyUrl ? tunnel.httpsOverHttp(...) : undefined;
   ```

## References

- [Tunnel Package Documentation](https://www.npmjs.com/package/tunnel)
- [Axios Proxy Issues](https://github.com/axios/axios/issues?q=is%3Aissue+proxy)
- [HTTP CONNECT Tunneling](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/CONNECT)
- Bosch LLM Farm Access & Network Tips (internal documentation)
