// JSDoc typedefs shared across model sources. Not imported at runtime —
// the project doesn't use TypeScript; this file is documentation only.

/**
 * @typedef {Object} ModelSourceCache
 * @property {string} key   localStorage key, versioned (e.g. 'hf:trending:v2')
 * @property {number} ttlMs freshness window in ms
 */

/**
 * @typedef {Object} ModelSource
 * @property {string}             id     stable key, e.g. 'hf-trending'
 * @property {string}             label  human label for the source toggle bar
 * @property {string|null}        badge  short chip badge stamped on emitted presets
 * @property {'static'|'remote'|'user'} kind
 * @property {ModelSourceCache|null} cache
 * @property {(opts?: object) => Promise<Preset[]>} fetch
 */

/**
 * @typedef {Object} Preset
 * @property {string} id
 * @property {string} [hfId]
 * @property {string} name
 * @property {string} group
 * @property {'dense'|'moe'} arch
 * @property {number} params
 * @property {number} [active]
 * @property {number} layers
 * @property {number} hidden
 * @property {number} heads
 * @property {number} kvheads
 * @property {number} headdim
 * @property {number} attnFrac
 * @property {number} slideFrac
 * @property {number} [slideWin]
 * @property {string} [note]
 * @property {number} [nativeWBytes]
 * @property {string} [badge]
 * @property {string} [source]
 * @property {string} [ollamaName]
 */

export {};
