import { describe, expect, it } from 'vitest';
import { Engine } from '../core/engine';
import { JQLParser } from '../core/parser';

describe('Engine', () => {
  it('should query a simple object', () => {
    const json = '{"name": "Leanne Graham", "email": "Sincere@april.biz", "phone": "123"}';
    const schema = '{ name, email }';

    const buffer = new TextEncoder().encode(json);
    const map = new JQLParser(schema).parse();

    const engine = new Engine(map);
    const result = engine.execute(buffer);

    expect(result).toEqual({
      name: "Leanne Graham",
      email: "Sincere@april.biz"
    });
    expect(result.phone).toBeUndefined();
  });

  it('should query a nested object', () => {
    const json = JSON.stringify({
      id: 1,
      name: "Leanne Graham",
      address: {
        street: "Kulas Light",
        city: "Gwenborough",
        zipcode: "92998"
      }
    });
    const schema = '{ name, address { street, city } }';

    const buffer = new TextEncoder().encode(json);
    const map = new JQLParser(schema).parse();
    const engine = new Engine(map);
    const result = engine.execute(buffer);

    expect(result).toEqual({
      name: "Leanne Graham",
      address: {
        street: "Kulas Light",
        city: "Gwenborough"
      }
    });
    expect(result.address.zipcode).toBeUndefined();
  });

  it('should handle arrays', () => {
    const json = JSON.stringify({
      users: [
        { id: 1, name: "A", active: true },
        { id: 2, name: "B", active: false }
      ]
    });
    const schema = '{ users { name } }';

    const buffer = new TextEncoder().encode(json);
    const map = new JQLParser(schema).parse();
    const engine = new Engine(map);
    const result = engine.execute(buffer);

    expect(result).toEqual({
      users: [
        { name: "A" },
        { name: "B" }
      ]
    });
  });
});
