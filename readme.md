# Rooter

An simple, small, and efficient router for Deno and Deno Deploy.

...in loving memory of the Brits who still think that this is how you pronounce "router" :D

## Usage

```ts
import { makeHandler, makeRoute } from 'https://deno.land/rooter@1.0.0/mod.ts'
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
	makeRoute('*', () => Response.json(
		{ error: { code: 'NOT_FOUND', message: 'The request resource was not found' } },
		{ status: 404 }
	))
])

await serve(handler, { port: 8000 })
```
