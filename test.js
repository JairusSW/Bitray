const Bitray = require('./')

Bitray.prototype.binary = Uint8Array.from(Buffer.from('Hello World 🌎'))

console.log(Bitray.prototype.toFormat('utf8'))