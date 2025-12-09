import SwaggerParser from '@apidevtools/swagger-parser';
import yaml from 'js-yaml';
import { OpenAPI, OpenAPIV3 } from 'openapi-types';
import { logger } from '../utils/logger';

export class OpenApiParser {
  private spec: OpenAPIV3.Document | null = null;

  public async parse(specContent: string): Promise<void> {
    try {
      const specObject = yaml.load(specContent);
      this.spec = (await SwaggerParser.validate(specObject as OpenAPI.Document)) as OpenAPIV3.Document;
      logger.info('OpenAPI specification parsed and validated successfully.');
    } catch (error: any) {
      logger.error('Failed to parse or validate OpenAPI specification', { error: error.message });
      throw new Error('Invalid OpenAPI specification');
    }
  }

  public getEndpoints(): { path: string; method: string; operation: OpenAPIV3.OperationObject }[] {
    if (!this.spec) {
      throw new Error('Specification not parsed yet.');
    }

    const endpoints: { path: string; method: string; operation: OpenAPIV3.OperationObject }[] = [];
    for (const path in this.spec.paths) {
      const pathItem = this.spec.paths[path];
      if (pathItem) {
        for (const method in pathItem) {
          if (Object.values(OpenAPIV3.HttpMethods).includes(method as OpenAPIV3.HttpMethods)) {
            const operation = pathItem[method as keyof typeof pathItem] as OpenAPIV3.OperationObject;
            endpoints.push({ path, method, operation });
          }
        }
      }
    }
    return endpoints;
  }

  public suggestExampleRequest(operationId: string): { body?: any; parameters?: any } {
    if (!this.spec) {
      throw new Error('Specification not parsed yet.');
    }

    for (const path in this.spec.paths) {
      const pathItem = this.spec.paths[path];
      if (pathItem) {
        for (const method in pathItem) {
          const operation = pathItem[method as keyof typeof pathItem] as OpenAPIV3.OperationObject;
          if (operation.operationId === operationId) {
            const requestBody = this.getExampleFromRequestBody(operation.requestBody);
            const parameters = this.getExampleFromParameters(operation.parameters);
            return { body: requestBody, parameters };
          }
        }
      }
    }
    throw new Error(`Operation with ID '${operationId}' not found.`);
  }

  private getExampleFromRequestBody(
    requestBody: OpenAPIV3.RequestBodyObject | OpenAPIV3.ReferenceObject | undefined
  ): any {
    if (!requestBody || '$ref' in requestBody) {
      return undefined;
    }
    const content = requestBody.content;
    if (content && content['application/json'] && content['application/json'].schema) {
      return this.generateExampleFromSchema(content['application/json'].schema);
    }
    return undefined;
  }

  private getExampleFromParameters(
    parameters: (OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject)[] | undefined
  ): any {
    if (!parameters) {
      return undefined;
    }
    const exampleParams: { [key: string]: any } = {};
    for (const param of parameters) {
      if ('$ref' in param) {
        continue;
      }
      if (param.in === 'query' || param.in === 'path' || param.in === 'header') {
        exampleParams[param.name] = this.generateExampleFromSchema(param.schema);
      }
    }
    return exampleParams;
  }

  private generateExampleFromSchema(
    schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject | undefined
  ): any {
    if (!schema || '$ref' in schema) {
      return undefined;
    }
    if (schema.example) {
      return schema.example;
    }
    switch (schema.type) {
      case 'string':
        return 'string';
      case 'number':
        return 0;
      case 'integer':
        return 0;
      case 'boolean':
        return false;
      case 'object':
        const obj: { [key: string]: any } = {};
        if (schema.properties) {
          for (const prop in schema.properties) {
            obj[prop] = this.generateExampleFromSchema(schema.properties[prop]);
          }
        }
        return obj;
      case 'array':
        return [this.generateExampleFromSchema(schema.items)];
      default:
        return undefined;
    }
  }
}
