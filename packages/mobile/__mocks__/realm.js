class MockRealmObject {}

class MockRealm {
  static open = jest.fn(() => Promise.resolve(new MockRealm()));
  
  write = jest.fn((callback) => callback());
  create = jest.fn();
  objects = jest.fn(() => []);
  objectForPrimaryKey = jest.fn();
  delete = jest.fn();
  deleteAll = jest.fn();
  close = jest.fn();
}

MockRealm.Object = MockRealmObject;

module.exports = MockRealm;
module.exports.default = MockRealm;
module.exports.Object = MockRealmObject;
