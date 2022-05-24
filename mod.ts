import { parsePattern } from './pattern.ts'

export interface RouteHandlerParams {
	params: Record<string, string>
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

		const response = await handler({ params, request, url })
		if (!response) return null

		return response
	}
}

/**
 * Generates a function that returns a Response for a Request.
 *
 * Takes in an array of routes that can be generated with the `makeRoute` function.
 */
export function makeHandler(routes: Route[]) {
	return async (request: Request): Promise<Response> => {
		const url = new URL(request.url)

		for (const route of routes) {
			const response = await route(request, url)
			if (response) return response
		}

		return new Response('not found', { status: 404 })
	}
}
