/**
 * Mock for @react-native-community/netinfo
 */

export default {
  addEventListener: jest.fn(),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, type: 'wifi' })),
};
