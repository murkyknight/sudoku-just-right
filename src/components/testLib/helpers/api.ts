type CustomResponse<T> = {
  data?: T
  status?: number
}

export function buildResponse<T>({ data, status = 200 }: CustomResponse<T>): Response {
  return {
    ok: status >= 200 && status <= 299,
    status: status,
    json: async () => data,
  } as Response
}

export function okResponse<T>(data: T): Response {
  return buildResponse({ data, status: 200 })
}

export function badRequestResponse(): Response {
  return buildResponse({ data: null, status: 400 })
}
