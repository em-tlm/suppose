const _ = require('lodash');
const Joi = require('joi');
const suppose = require('../src/suppose');
const chai = require('chai');
const sinon = require('sinon');
const { expect } = chai;

let immutable;
try {
  immutable = require('immutable')
} catch (e) {
  // immutable not installed
}

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
        fooId: config.hasFoo ? 'fakeId' : null,
      };
    }, {
      typeName: 'CheckoutCart',
      persist: persistMockFn,
      remove: removeMockFn,
    });
  });

  it('fixture can be rendered', function() {
    const model = suppose('emptyCart').render({hasFoo: true});

    expect(model).to.eql({
      items: [],
      itemsCount: 0,
      fooId: 'fakeId',
    });
  });

  it('fixture can be persisted', function() {
    const promise  = suppose('emptyCart').persist({hasFoo: true});
    expect(promise).to.be.instanceOf(Promise);

    return promise.then((result) => {
      expect(result).to.eql('fakePersistResult');
    });
  });

  it('fixture can converted into immutableJS if installed', function() {
    if (immutable) {
      let model = suppose('emptyCart').asImmutable({hasFoo: true});
      expect(immutable.isImmutable(model)).to.be.true;

      expect(model.toJS()).to.eql({
        items: [],
        itemsCount: 0,
        fooId: 'fakeId',
      });
    } else {
      expect(() => {
        suppose('emptyCart').asImmutable({hasFoo: true});
      }).to.throw(suppose.SupposeError);
    }
  });

  it('fixture can be removed', function() {
    const fixture  = suppose('emptyCart');

    return fixture.persist({hasFoo: true}).then((result)=> {
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
        fooId: (config || {}).hasFoo ? 'fakeId' : null,
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
      suppose('twoItemsInCart').render({hasFoo: true});
    }).to.throw('missingBaz');
  });
});

describe('when fixture rendered has merges', function() {
  beforeEach(function() {
    suppose.defineFixture('twoItemsInCart', (config) => {
      return {
        items: [],
        itemsCount: 0,
        fooId: config.hasFoo ? 'fakeId' : null,
        metadata: {
          foo: 'foo',
        },
      };
    });
  });

  it('it merges', function() {
    expect(
      suppose('twoItemsInCart').butMerge({ vip: 'trep'}).render({hasFoo: false})
    ).to.eql({
      items: [],
      itemsCount: 0,
      fooId: null,
      metadata: {
        foo: 'foo'
      },
      vip: 'trep'
    });
  });


  it('it merges deeply', function() {
   expect(
     suppose('twoItemsInCart').butMerge({ metadata: { baz: 'baz' }}).render({hasFoo: false})
   ).to.eql({
     items: [],
     itemsCount: 0,
     fooId: null,
     metadata: {
       foo: 'foo',
       baz: 'baz',
     },
    });
  });

  it('if functions are passed, it merges the result of running the function', function() {
   expect(
     suppose('twoItemsInCart')
       .butMerge({vap: 1})
       .butMerge((data) => {
         return {vap: data.vap + 1}
       })
       .render({})
   ).to.eql({
     items: [],
     itemsCount: 0,
     fooId: null,
     metadata: {
       foo: 'foo',
     },
     vap: 2,
    });
  });

});

