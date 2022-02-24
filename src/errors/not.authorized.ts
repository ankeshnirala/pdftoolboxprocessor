import { CustomError } from "./custom.error";

class NotAuthError extends CustomError {
  statusCode = 401;

  constructor() {
    super("Not authorzed");

    Object.setPrototypeOf(this, NotAuthError.prototype);
  }

  serializeErrors() {
    return [{ message: "Not authorized" }];
  }
}

export { NotAuthError };