const _ = require('lodash');
const Joi = require('joi');
const suppose = require('../src/suppose');
const chai = require('chai');
const sinon = require('sinon');
const { expect } = chai;

afterEach(() => {
  suppose.resetAll();
});

//
// tests
//
describe('defineFixture', function() {
  let persistMockFn;
  let removeMockFn;

  beforeEach(function() {
    persistMockFn = sinon.spy(() => {
      return 'fakePersistResult';
    });

    removeMockFn = sinon.spy(() => {
      return 'fakeRemoveResult';
    });

    suppose.defineFixture('emptyCart', (config) => {
      return {
        items: [],
        itemsCount: 0,
        fooId: config.fooId,
      };
    }, {
      typeName: 'CheckoutCart',
      persist: persistMockFn,
      remove: removeMockFn,
    });
  });

  it('fixture can be rendered', function() {
    const model = suppose('emptyCart').render({fooId: 'foo'});

    expect(model).to.eql({
      items: [],
      itemsCount: 0,
      fooId: 'foo',
    });
  });

  it('fixture can be persisted', function() {
    const promise  = suppose('emptyCart').persist({fooId: 'foo'});
    expect(promise).to.be.instanceOf(Promise);

    return promise.then((result) => {
      expect(result).to.eql('fakePersistResult');
    });
  });

  it('fixture can be removed', function() {
    const fixture  = suppose('emptyCart');

    return fixture.persist({fooId: 'foo'}).then((result)=> {
      expect(fixture.getAsPersisted()).to.equal('fakePersistResult');
      return fixture.remove();
    }).then((result) => {
      expect(result).to.equal('fakeRemoveResult');
    });
  });
});

describe('when the fixture doesnt exist', function() {
  it('throws an error', function() {
    expect(function() {
      suppose('doesnt_exist');
    }).to.throw('Fixture not found');
  });
});

describe('when the fixture generated doesnt validate correctly', function() {
  beforeEach(function() {
    suppose.defineFixture('twoItemsInCart', (config) => {
      return {
        items: [],
        itemsCount: 0,
        fooId: config.fooId,
      };
    }, {
      typeName: 'CheckoutCart',
      schema: Joi.object().keys({
        missingBaz: Joi.string().required(),
      }),
      persist: () => {},
      remove: () => {},
    });
  });

  it('throws an error', function() {
    expect(function() {
      suppose('twoItemsInCart').render({fooId: 'foo'});
    }).to.throw('missingBaz');
  });
});

