/* src/utils/date.js — \u5171\u7528\u65e5\u671f\u5de5\u5177 */

export const localDateStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
