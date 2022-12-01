const { assert } = require('chai');

const getUserByEmail = require('../helpers.js');

describe('getUserByEmail', function() {
  it('should take in email and user object return a user object if found', function() {
    const testUsers = {
      userRandomID: {
        id: "userRandomID",
        email: "user@example.com",
        password: "purple-monkey-dinosaur",
      },
      user2RandomID: {
        id: "user2RandomID",
        email: "user2@example.com",
        password: "dishwasher-funk",
      },
    };

    const userEmail = "user@example.com";
    const expectedUserObj = {
      id: "userRandomID",
      email: "user@example.com",
      password: "purple-monkey-dinosaur",
    };
    assert.deepEqual(getUserByEmail(userEmail, testUsers), expectedUserObj);
  });

  it('should take in email and user object return undefined if not found', function() {
    const testUsers = {
      userRandomID: {
        id: "userRandomID",
        email: "user@example.com",
        password: "purple-monkey-dinosaur",
      },
      user2RandomID: {
        id: "user2RandomID",
        email: "user2@example.com",
        password: "dishwasher-funk",
      },
    };

    const userEmail = "test@example.com";
    assert.deepEqual(getUserByEmail(userEmail, testUsers), undefined);
  });
});