/**
 * An error that carries the HTTP status to answer with.
 *
 * Thrown from controllers and read by the routes, so a refusal keeps its stack,
 * satisfies `instanceof Error` for anything that logs or inspects it, and does
 * not pass a bare object literal around as an exception.
 */
export class HttpError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)

    this.name = 'HttpError'
    this.status = status

    // Restores the prototype chain when this file is transpiled to ES5, where
    // extending a built-in leaves `instanceof HttpError` false: the routes
    // decide the status from the class, so that identity has to hold.
    Object.setPrototypeOf(this, HttpError.prototype)
  }
}
