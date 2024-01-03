"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatchAsyncError = void 0;
// A promise is aan object that will return a value in the future
// the value can be either a resolved value [promise was successful]
// or the value can be a rejected value [there was an error]
// Promise.resolve -> converting a value that might be a promise to a promise
// Promise.resolve(value) is a convenience method that does new Promise(resolve => resolve(value))
// If the value is a promise it will be returned, if it is a promise from a userland promise library
// it will be converted to a native promise. If it is a plain value it will be converted
// to promise fulfilled with that value
const CatchAsyncError = (theFunc) => (req, res, next) => {
    Promise.resolve(theFunc(req, res, next)).catch(next);
};
exports.CatchAsyncError = CatchAsyncError;
