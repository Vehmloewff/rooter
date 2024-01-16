import { parsePattern } from './pattern.ts'
import { errorToResponse } from './deps.ts'

export {
	BadParamsError,
	ForbiddenError,
	isBadParamsError,
	isForbiddenError,
	isNotAuthenticatedError,
	isNotFoundError,
	isUserError,
	NotAuthenticatedError,
	NotFoundError,
	UserError,
} from './deps.ts'

export type ErrorInterceptorFn = (message: string, fullError: string) => unknown
export type RequestInterceptorFn = (request: Request, url: URL) => unknown
export type ResponseInterceptorFn = (response: Response) => unknown

let errorInterceptorFn: ErrorInterceptorFn | null = null
let requestInterceptorFn: RequestInterceptorFn | null = null
let responseInterceptorFn: ResponseInterceptorFn | null = null

export interface RouteHandlerParams {
	params: Record<string, string | undefined>
	url: URL
	request: Request
}

type MaybePromise<T> = Promise<T> | T
export type RouteHandlerResponse = MaybePromise<null | undefined | void | Response>
export type Route = (request: Request, url: URL) => Promise<Response | null>

/**
 * Makes a route to be passed into the `makeHandler` function.
 *
 * `pattern` can be an valid url pattern, or a valid url pattern with a method name and a space prepended.  Examples:
 * - GET /index.html
 * - POST /
 * - /
 * - /blog/posts/:slug
 *
 * ... and yes, all paths must start with a slash.
 *
 * If the checks on `pattern` pass, `handler` will be called.
 *
 * An object with three parameters is passed into the handler.
 * - The `params` field contains a record of all the url parameter parsed out of the url.
 * - The `url` field contains the `URL` of the request
 * - The `request`, of course, contains the original `Request`
 */
export function makeRoute(pattern: string, handler: (params: RouteHandlerParams) => RouteHandlerResponse): Route {
	const { exec } = parsePattern(pattern)

	return async (request, url) => {
		const params = exec(url.pathname, request.method)
		if (!params) return null

		try {
			const response = await handler({ params, request, url })
			if (!response) return null

			return response
		} catch (error) {
			if (errorInterceptorFn) errorInterceptorFn(error.message, error.stack)
			return errorToResponse(error)
		}
	}
}

/**
 * Generates a function that returns a Response for a Request.
 *
 * Takes in an array of routes that can be generated with the `makeRoute` function.
 */
export function makeHandler(routes: Route[]) {
	const intercept = (response: Response) => {
		if (responseInterceptorFn) responseInterceptorFn(response)
		return response
	}

	return async (request: Request): Promise<Response> => {
		// Respond with ok to all options requests
		if (request.method === 'OPTIONS') return intercept(new Response('ok'))

		const url = new URL(request.url)

		if (requestInterceptorFn) requestInterceptorFn(request, url)

		for (const route of routes) {
			const response = await route(request, url)
			if (response) return intercept(response)
		}

		return intercept(new Response('not found', { status: 404 }))
	}
}

export function setErrorInterceptor(fn: ErrorInterceptorFn) {
	errorInterceptorFn = fn
}

export function setRequestInterceptor(fn: RequestInterceptorFn) {
	requestInterceptorFn = fn
}

export function setResponseInterceptor(fn: ResponseInterceptorFn) {
	responseInterceptorFn = fn
}

export function enableCors(domains = '*'): ResponseInterceptorFn {
	return (response) => {
		response.headers.append('access-control-allow-origin', domains)
		response.headers.append('access-control-request-headers', '*')
		response.headers.append('access-control-request-method', '*')
	}
}
