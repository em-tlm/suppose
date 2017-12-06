# suppose.js
A minimalistic data fixtures library that plays well with unit tests and redux reducer tests.

## Example



```javascript
/* myFixtures.js */

const fixtureConfig = {
  persist: () => { /* save to db */ },
  remove: () => { /* remove from db */ },
  schema: Joi.object(),  
};

suppose.defineFixture('authed_user', (config) => {
  return {
    id: config.id || randomUserId(),
    name: config.name || 'Michael Eddington',
    authToken: config.authToken || randomString(),
  }
}, fixtureConfig);



/* myFoo.test.js */

// Just render the fixture into a POJO
const renderedFixture = suppose('basic_user').butMerge({
  name: 'Ben Sisko'
}).render();

// Render the fixture and then pass it to the `persist` function
// passed into the fixture config.
const promise = suppose('basic_user').butMerge({
  name: 'Ben Sisko'
}).persist().then((result) => {
  // result is what was returned by the `persist` function
});



```

## Creating single objects vs entire datasets
Suppose.js can be used either to create fixtures of individual objects (eg. a User) or it can be used to generate entire datasets (eg. a plausible db).  The syntax is the same.  The only difference would be in how you'd implement the 
`persist` and `remove` functions.  
