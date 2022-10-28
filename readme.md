# Rooter

An simple, small, and efficient router for Deno and Deno Deploy.

...in loving memory of the Brits who still think that this is how you pronounce "router" 😄

## Usage

```ts
import { makeHandler, makeRoute, NotFoundError } from 'https://deno.land/rooter@1.0.0/mod.ts'
import { serve } from 'https://deno.land/std@0.40.0/http/mod.ts'

const postRoute = makeRoute('GET /blog/posts/:slug', ({ params }) => {
	const postSlug = params.slug

	// ...

	return Response.json({ ... })
})

const handler = makeHandler([
	// Insert a route inline
	makeRoute('GET /', () => Response.json({ ... })),

	// ... or make use of a predefined route
	postRoute,
	
	// Optionally add a catchall for 404s
	makeRoute('*', () => new NotFoundError('Route does not exist'))
])

await serve(handler, { port: 8000 })
```

### Error Handling

<!-- TODO: add note about response error handling methodology -->

When an error is thrown inside a makeRoute handler, it is converted into an http response. Generally this just means writing message of error to the body of the response and setting the status code to 500. There are, however, several error classes exported from `mod.ts` that are associated with certain status codes:

- `NotFoundError` - 404
- `BadParamsError` - 400
- `ForbiddenError` - 403
- `NotAuthorizedError` - 401
- `UserError` - 400

If one of these errors is thrown, the associated status code will placed on the response.
