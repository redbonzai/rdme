const assert = require('assert');

const api = require('../api');

describe('api', () => {
  let error;
  beforeAll(() => {
    error = { console };
  });

  afterAll(() => {
    console.error = error;
  });

  describe('#api()', () => {
    it('action not found', done => {
      console.error = message => {
        assert(message.includes('Action not found'));
        return done();
      };
      api.api('notARealAction');
    });
  });
});
