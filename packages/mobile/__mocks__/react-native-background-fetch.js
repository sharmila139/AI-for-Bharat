/**
 * Mock for react-native-background-fetch
 */

export default {
  configure: jest.fn(),
  scheduleTask: jest.fn(),
  finish: jest.fn(),
  STATUS_RESTRICTED: 0,
  STATUS_DENIED: 1,
  STATUS_AVAILABLE: 2,
};
