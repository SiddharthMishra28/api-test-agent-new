import 'mocha';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import fs from 'fs';
import path from 'path';
import { OpenApiParser } from '../../src/tools/openApiParser';

chai.use(chaiAsPromised);

describe('OpenApiParser', () => {
  const specContent = fs.readFileSync(path.join(__dirname, 'petstore.yaml'), 'utf-8');

  it('should parse a valid OpenAPI spec', async () => {
    const parser = new OpenApiParser();
    await expect(parser.parse(specContent)).to.eventually.be.fulfilled;
  });

  it('should throw an error for an invalid spec', async () => {
    const parser = new OpenApiParser();
    const invalidSpec = 'this is not a valid spec';
    await expect(parser.parse(invalidSpec)).to.be.rejectedWith('Invalid OpenAPI specification');
  });

  it('should extract endpoints correctly', async () => {
    const parser = new OpenApiParser();
    await parser.parse(specContent);
    const endpoints = parser.getEndpoints();
    expect(endpoints).to.have.lengthOf(2);
    expect(endpoints[0].path).to.equal('/pets');
    expect(endpoints[0].method).to.equal('get');
    expect(endpoints[1].path).to.equal('/pets');
    expect(endpoints[1].method).to.equal('post');
  });

  it('should suggest an example request for an operation', async () => {
    const parser = new OpenApiParser();
    await parser.parse(specContent);
    const example = parser.suggestExampleRequest('createPet');
    expect(example).to.deep.equal({
      body: {
        id: 0,
        name: 'Fido',
        tag: 'string',
      },
      parameters: undefined
    });
  });

  it('should throw an error if operationId is not found', async () => {
    const parser = new OpenApiParser();
    await parser.parse(specContent);
    expect(() => parser.suggestExampleRequest('nonexistentOperation')).to.throw('Operation with ID \'nonexistentOperation\' not found.');
  });
});
