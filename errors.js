/** An actionable failure; changed=true requires refreshing before retrying. */
export class ContextError extends Error {
  constructor(code, message = code, changed = false) {
    super(message);
    this.code = code;
    this.changed = changed;
  }
}
