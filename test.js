const Bitray = require('./index.js')

let format = 'hex'

const bit1 = new Bitray('Hello World 🌎')

const bit2 = new Bitray('Chubby Bunny 🐰')

const buf1 = Buffer.from('Hello World 🌎')

const buf2 = Buffer.from('Chubby Bunny 🐰')

console.log('~~Bitray~~')

console.log(bit1.toFormat(format))

console.log(bit2.toFormat(format))

console.log('bitray:', new Bitray(bit1.toFormat(format), format))

console.log('~~Buffer~~')

console.log(buf1.toString(format))

console.log(buf2.toString(format))

console.log(Uint8Array.from(buf1))