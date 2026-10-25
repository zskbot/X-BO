import { describe, expect, it } from 'vitest';
import { openApiSpec } from './openapi.js';

describe('OpenAPI specification', () => {
  it('documents the health probes and supported chat endpoints', () => {
    expect(openApiSpec.openapi).toBe('3.0.3');
    expect(openApiSpec.paths['/livez'].get).toBeDefined();
    expect(openApiSpec.paths['/readyz'].get).toBeDefined();
    expect(openApiSpec.paths['/health'].get).toBeDefined();
    expect(openApiSpec.paths['/chat'].post.requestBody.required).toBe(true);
    expect(openApiSpec.paths['/v1/chat'].post.requestBody.required).toBe(true);
  });

  it('requires a message and bounds the prompt size', () => {
    for (const path of ['/chat', '/v1/chat']) {
      const schema = openApiSpec.paths[path].post.requestBody.content['application/json'].schema;
      expect(schema.required).toContain('message');
      expect(schema.properties.message.maxLength).toBe(8000);
      expect(schema.properties.model.maxLength).toBe(64);
    }
  });
});
