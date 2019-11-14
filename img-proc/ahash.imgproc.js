const CanvasTransformer = require('./process.imgproc')
const { Convert } = require('../utils')

export default aHash

/**
 * @typedef aHashOptions
 * @prop {number} width
 * @prop {number} height
 * @prop {number} radix The radix of the hash
 * @prop {boolean} debug Include debug info in the result
 *
 * @param {*} data
 * @param {aHashOptions} options
 */
async function aHash(data, options = {}) {
	const { width = 8, height = 8, radix = 16, debug = false } = options
	const img = await new CanvasTransformer(data)
	img.filter('grayscale').resize(width, height)
	const pixels = img.toRaw().data

	let total = 0
	for (let i = 0; i < pixels.length; i += 4) {
		const val = pixels[i]
		total += val
	}

	const average = total / (pixels.length / 4)
	let hash = ''
	for (let i = 0; i < pixels.length; i += 4) {
		const val = pixels[i]
		hash += val > average ? '1' : '0'
	}

	hash = Convert.radix(hash, 2, radix)
	const result = {
		hash
	}
	if (debug) {
		result.debug = {
			image: img.toDataUrl(),
			values: {
				average,
				total
			}
		}
	}
	return result
}
