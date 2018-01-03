const _ = require('lodash');
const Joi = require('joi');

let immutable;

try {
  immutable = require('immutable')
} catch (e) {
  // immutable not installed
}

let _fixtureDefsByName = {};

function resetAll() {
  _fixtureDefsByName = {};
}

function getFixture(fixtureName) {
  const fixture = _fixtureDefsByName[fixtureName];

  if (!fixture) {
    throw new Error('Fixture not found');
  }

  return _fixtureDefsByName[fixtureName];
}

function setFixture(fixtureName, fixture) {
  if (_fixtureDefsByName[fixtureName]) {
    throw new Error('Fixture already exists');
  }

  _fixtureDefsByName[fixtureName] = fixture;
}

function defineFixture(fixtureName, generateFn, options={}) {
  const fixture = Object.assign({
    fixtureName,
    generateFn,
  },{
    schema: Joi.object(),
    persist: () => Promise.resolve(),
    remove: () => Promise.resolve(),
  }, options);

  setFixture(fixtureName, fixture);
}

function suppose(fixtureName) {
  const fixtureDef = getFixture(fixtureName);
  const { typeName } = fixtureDef;

  let isPersisted = false;
  let objMerges = [];

  let asPersisted;

  function SupposeChainable() {
    this.asImmutable = (config) => {
      if (immutable) {
        return immutable.fromJS(this.render(config));
      }

      throw new SupposeError('The method asImmutable is only available if immutable.js is installed ');
    };

    this.render = (config={}) => {
      let model = fixtureDef.generateFn(config);
      const toMerge = [fixtureDef.generateFn(config), ...objMerges];

      model = _.reduce(toMerge, (_acc, _objMerge) => {
        let { isDeep, data } = _objMerge;

        if (data instanceof SupposeChainable) {
          data = data.render();
        } if (_.isFunction(data)) {
          data = data(_acc);
        }

        if (isDeep) {
          return _.merge(_acc, data);
        } else {
          return Object.assign(_acc, data);
        }
      }, model);

      if (fixtureDef.schema) {
        const result = Joi.attempt(model, fixtureDef.schema);
        model = result;
      }

      return model;
    };

    this.persist = (config) => {
      if (isPersisted) throw new Error('Already persisted this fixture');
      if (!fixtureDef.persist) throw new Error('Persist function not given.');
      if (!fixtureDef.remove) throw new Error('Remove function not given.');

      const model = this.render(config);
      return Promise.resolve(fixtureDef.persist(model)).then((result) => {
        asPersisted = result;
        return result;
      });
    };

    this.remove = () => {
      return fixtureDef.remove(asPersisted);
    };

    this.butMerge = (_obj) => {
      let obj = { isDeep: true, data: _obj };

      objMerges.push(obj)

      return this;
    };

    this.butShallowMerge = (_obj) => {
      let obj = { isDeep: false, data: _obj };

      objMerges.push(obj)

      return this;
    };

    // returns the data as returned by the `persist` function passed in configuration.
    this.getAsPersisted = () => {
      return asPersisted;
    };
  }

  return new SupposeChainable();
}

class SupposeError extends Error { }

module.exports = Object.assign(suppose, {
  resetAll,
  defineFixture,
  SupposeError
});


