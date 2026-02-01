

export type HttpErrorContext = {
  method?: string;
  operation?: string; // e.g. "fetchUser", "updateProfile"
  requestId?: string;
}

export class HttpError extends Error {
  readonly status: number
  readonly response: Response
  readonly context?: HttpErrorContext

  constructor(
    response: Response,
    context?: HttpErrorContext,
    messageOverride?: string
  ) {
    super(messageOverride ?? formatHttpErrorMessage(response, context))
    this.name = 'HttpError'
    this.status = response.status
    this.response = response
    this.context = context
  }

  static withOp(response: Response, operation: string) {
    return new HttpError(
      response,
      { operation }
    )
  }
}

function formatHttpErrorMessage(
  response: Response,
  context?: HttpErrorContext
): string {
  const op = context?.operation ? ` (${context.operation})` : ''
  return `HTTP ${response.status}${op}` // HTTP 400 (fetchRootManifest)
}

