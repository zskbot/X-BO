export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'x-bo API',
    version: '0.1.0',
    description: 'Public health and chat endpoints for the x-bo service.',
  },
  paths: {
    '/livez': {
      get: {
        summary: 'Liveness probe',
        responses: { '200': { description: 'Service process is alive.' } },
      },
    },
    '/readyz': {
      get: {
        summary: 'Readiness probe',
        responses: { '200': { description: 'Service is ready to accept requests.' } },
      },
    },
    '/health': {
      get: {
        summary: 'Health summary',
        responses: { '200': { description: 'Health summary.' } },
      },
    },
    '/chat': {
      post: {
        summary: 'Send a chat prompt (legacy endpoint)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: { type: 'string', minLength: 1, maxLength: 8000 },
                  model: { type: 'string', maxLength: 64 },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Agent response.',
            content: { 'application/json': { schema: { type: 'object', properties: { result: { type: 'string' } } } },
          },
          '400': { description: 'Invalid prompt or provider.' },
          '413': { description: 'Prompt is too large.' },
          '429': { description: 'Rate limit exceeded.' },
          '500': { description: 'Internal error.' },
        },
      },
    },
    '/v1/chat': {
      post: {
        summary: 'Send a chat prompt',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: { type: 'string', minLength: 1, maxLength: 8000 },
                  model: { type: 'string', maxLength: 64 },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Agent response.',
            content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, response: { type: 'string' } } } },
          },
          '400': { description: 'Invalid prompt or provider.' },
          '413': { description: 'Prompt is too large.' },
          '429': { description: 'Rate limit exceeded.' },
          '502': { description: 'AI provider failed.' },
        },
      },
    },
  },
};
