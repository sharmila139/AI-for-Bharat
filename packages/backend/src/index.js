/**
 * Lambda Entry Point
 * Exports handler from lambda-complete.js
 */

const { handler } = require('./lambda-complete');

exports.handler = handler;
