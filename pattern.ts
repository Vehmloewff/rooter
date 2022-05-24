/** Tests patterns like:
 * GET /
 * POST /books/:id
 * /settings
 *
 * The last one will return a result regardless of what the method is.
 */
export function parsePattern(pattern: string) {
	pattern = pattern.trim()

	// Now, we assign the method.
	// If there is a method on the front of the pattern, eg. 'GET /history',
	// assign it to the method variable and remove it from the pattern
	let method: null | string = null
	if (!pattern.trim().startsWith('/')) {
		const sections = pattern.split(' ')
		method = sections[0].toUpperCase()

		pattern = sections.slice(1).join(' ')
	}

	const urlPattern = new URLPattern({ pathname: pattern })

	function exec(testPath: string, testMethod: string) {
		testMethod = testMethod.toUpperCase()

		if (method && method !== testMethod) return null

		return urlPattern.exec({ pathname: testPath })?.pathname.groups || null
	}

	return { exec }
}
