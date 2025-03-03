# FocEliza Onchain State Tool API

This API provides endpoints to interact with the onchain state of agents and spaces.

## API Endpoints

### Base URL

All API endpoints are relative to the base URL of your application.

### Response Format

All API responses follow this standard format:

```json
{
  "status": "success" | "error",
  "data": { ... } | null,
  "message": "Optional success message",
  "error": "Optional error message"
}
```

### Endpoints

#### GET /api

Returns information about the API.

**Response**:
```json
{
  "status": "success",
  "message": "API is running",
  "endpoints": [
    "/api/agents",
    "/api/spaces",
    "/api/environments"
  ]
}
```

#### GET /api/agents

Get agents by space.

**Query Parameters**:
- `space` (required): The space address
- `start` (optional): Starting index (default: 0)
- `limit` (optional): Maximum number of results (default: 100)

**Response**:
```json
{
  "status": "success",
  "data": ["0x123...", "0x456..."]
}
```

#### GET /api/agents/:address

Get details for a specific agent.

**Response**:
```json
{
  "status": "success",
  "data": {
    "address": "0x123...",
    "info": { ... },
    "environmentKeys": ["API_KEY", "SECRET"]
  }
}
```

#### GET /api/spaces

Get spaces by creator.

**Query Parameters**:
- `creator` (required): The creator's address
- `start` (optional): Starting index (default: 0)
- `limit` (optional): Maximum number of results (default: 100)

**Response**:
```json
{
  "status": "success",
  "data": ["0x123...", "0x456..."]
}
```

#### GET /api/environments

Get environment keys for an agent.

**Query Parameters**:
- `agent` (required): The agent's address

**Response**:
```json
{
  "status": "success",
  "data": {
    "agent": "0x123...",
    "environmentKeys": ["API_KEY", "SECRET"]
  }
}
```

#### GET /api/environments/:agent

Get a specific environment value for an agent.

**Query Parameters**:
- `key` (required): The environment key

**Response**:
```json
{
  "status": "success",
  "data": {
    "agent": "0x123...",
    "key": "API_KEY",
    "value": "your-api-key"
  }
}
```

## Client-Side Usage

You can use the provided `apiClient` utility to interact with these endpoints:

```typescript
import apiClient from "../utils/apiClient";

// Get spaces for a creator
const spaces = await apiClient.getSpaces(creatorAddress);

// Get agents for a space
const agents = await apiClient.getAgents(spaceAddress);

// Get agent details
const agentDetails = await apiClient.getAgentDetails(agentAddress);

// Get environment keys for an agent
const envKeys = await apiClient.getEnvironmentKeys(agentAddress);
```
