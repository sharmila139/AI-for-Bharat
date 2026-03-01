module.exports = {
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: {
        latitude: 12.9716,
        longitude: 77.5946,
        accuracy: 10,
      },
    })
  ),
  reverseGeocodeAsync: jest.fn(() =>
    Promise.resolve([
      {
        street: 'Test Street',
        city: 'Test City',
        region: 'Test Region',
        postalCode: '123456',
      },
    ])
  ),
  Accuracy: {
    High: 1,
  },
};
