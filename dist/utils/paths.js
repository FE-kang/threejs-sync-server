"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROOT_DIR = void 0;
exports.resolveRoot = resolveRoot;
const path_1 = __importDefault(require("path"));
exports.ROOT_DIR = process.cwd();
function resolveRoot(...segments) {
    return path_1.default.join(exports.ROOT_DIR, ...segments);
}
