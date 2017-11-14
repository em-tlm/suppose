const _ = require('lodash');
const Joi = require('joi');

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
    this.render = (config) => {
      let model = fixtureDef.generateFn(config);

      const args = [{}, model].concat(objMerges);
      model = _.merge.apply(_, args)

      if (fixtureDef.schema) {
        const result = Joi.validate(model, fixtureDef.schema, {
          stripUnknown: true,
        });

        if (result.error) {
          throw result.error;
        }
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

    this.butWith = () => {
      objMerges.push(obj)
    };

    // returns the data as returned by the `persist` function passed in configuration.
    this.getAsPersisted = () => {
      return asPersisted;
    };
  }

  return new SupposeChainable();
}

module.exports = Object.assign(suppose, {
  resetAll,
  defineFixture,
});


