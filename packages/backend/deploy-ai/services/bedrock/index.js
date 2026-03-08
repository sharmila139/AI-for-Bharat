"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBedrockService = exports.BedrockService = exports.getBedrockClient = exports.BedrockClient = void 0;
var client_1 = require("./client");
Object.defineProperty(exports, "BedrockClient", { enumerable: true, get: function () { return client_1.BedrockClient; } });
Object.defineProperty(exports, "getBedrockClient", { enumerable: true, get: function () { return client_1.getBedrockClient; } });
var service_1 = require("./service");
Object.defineProperty(exports, "BedrockService", { enumerable: true, get: function () { return service_1.BedrockService; } });
Object.defineProperty(exports, "getBedrockService", { enumerable: true, get: function () { return service_1.getBedrockService; } });
