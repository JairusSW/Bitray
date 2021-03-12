const hexLookupTable = (() => {
  const alphabet = '0123456789abcdef'
  const table = new Array(256)
  for (let i = 0; i < 16; ++i) {
    const i16 = i * 16
    for (let j = 0; j < 16; ++j) {
      table[i16 + j] = alphabet[i] + alphabet[j]
    }
  }
  return table
})()

const decLookupTable = (() => {
  const alphabet = '0123456789abcdef'
  const table = {}
  for (let i = 0; i < 16; ++i) {
    const i16 = i * 16
    for (let j = 0; j < 16; ++j) {
      table[alphabet[i] + alphabet[j]] = i16 + j
    }
  }
  return table
})()

const Base64 = require('base64-js')

const Base58 = base()

class Bitray extends Uint8Array {

  constructor(data, encoding) {

    let binary

    if (typeof encoding !== 'string' || encoding === '') {

      encoding = 'utf8'

    }

    if (encoding === 'utf8' || encoding === 'utf-8') {
        
      binary = utf8Decode(data) || new Uint8Array(0)

    } else if (['latin1', 'binary'].includes(encoding)) {
        
      binary = latinDecode(data) || new Uint8Array(0)

    } else if (encoding === 'hex') {
        
      binary = hexDecode(data) || new Uint8Array(0)

    } else if (['ucs2', 'ucs-2', 'utf16le', 'utf-16le'].includes(encoding)) {

      binary = utf16Decode(data) || new Uint8Array(0)

    } else if (encoding === 'base64') {

      binary = Base64.toByteArray(data) || new Uint8Array(0)

    } else if (encoding === 'base58') {

      binary = Base58.decode(data) || new Uint8Array(0)

    } else {

      throw new Error('Unknown Encoding Provided. Recieved Encoding "' + encoding + '"')

    }

    super(binary.length)

    for (let i = 0; i < binary.length; i++) {
        
      super.fill(binary[i], i, i + 1)

    }

    this.binary = binary

  }

  toFormat(encoding) {

    if (['utf-8', 'utf8'].includes(encoding)) {

        const res = []
        let i = 0
        while (i < this.binary.length) {
            const firstByte = this.binary[i]
            let codePoint = null
            let bytesPerSequence = (firstByte > 0xEF)
            ? 4
            : (firstByte > 0xDF)
                ? 3
                : (firstByte > 0xBF)
                    ? 2
                    : 1
            if (i + bytesPerSequence <= this.binary.length) {
            let secondByte, thirdByte, fourthByte, tempCodePoint
            switch (bytesPerSequence) {
                case 1:
                if (firstByte < 0x80) {
                    codePoint = firstByte
                }
                break
                case 2:
                secondByte = this.binary[i + 1]
                if ((secondByte & 0xC0) === 0x80) {
                    tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
                    if (tempCodePoint > 0x7F) {
                    codePoint = tempCodePoint
                    }
                }
                break
                case 3:
                secondByte = this.binary[i + 1]
                thirdByte = this.binary[i + 2]
                if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
                    tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
                    if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                    codePoint = tempCodePoint
                    }
                }
                break
                case 4:
                secondByte = this.binary[i + 1]
                thirdByte = this.binary[i + 2]
                fourthByte = this.binary[i + 3]
                if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
                    tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
                    if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                    codePoint = tempCodePoint
                    }
                }
            }
            }
            if (codePoint === null) {
            codePoint = 0xFFFD
            bytesPerSequence = 1
            } else if (codePoint > 0xFFFF) {
            codePoint -= 0x10000
            res.push(codePoint >>> 10 & 0x3FF | 0xD800)
            codePoint = 0xDC00 | codePoint & 0x3FF
            }
            res.push(codePoint)
            i += bytesPerSequence
        }
        const len = res.length
        if (len <= 0x1000) {
            let ress = ''
            for (let i = 0; i < res.length; i++) {
            ress += String.fromCharCode(res[i])      
            }
            return ress
        }
        let resi = ''
        let ii = 0
        while (ii < len) {
            resi += String.fromCharCode(res.slice(ii, ii += 0x1000))
        }
        return resi

    }

    if (['binary', 'latin1'].includes(encoding)) {
      
      let ret = ''

      for (let i = 0; i < this.binary.length; ++i) {

        ret += String.fromCharCode(this.binary[i])

      }

      return ret

    }

    if (['hex'].includes(encoding)) {

      let out = ''

      for (let i = 0; i < this.binary.byteLength; ++i) {

        out += hexLookupTable[this.binary[i]]

      }

      return out

    }

    if (['ucs2', 'ucs-2', 'utf16le', 'utf-16le'].includes(encoding)) {

      let res = ''
      
      for (let i = 0; i < this.binary.length - 1; i += 2) {

        res += String.fromCharCode(this.binary[i] + (this.binary[i + 1] * 256))

      }

      return res

    }

    if (encoding === 'base64') {

      return Base64.fromByteArray(this.binary)

    }

    if (encoding === 'base58') {

      return Base58.encode(this.binary)

    }

  }

}

Bitray.from = (data, encoding) => {

  if (typeof encoding !== 'string' || encoding === '') {

    encoding = 'utf8'

  }

  if (encoding === 'utf8' || encoding === 'utf-8') {
      
    utf8Decode(data)

  } else if (['latin1', 'binary'].includes(encoding)) {
      
    latinDecode(data)

  } else if (encoding === 'hex') {
      
    hexDecode(data)

  } else if (['ucs2', 'ucs-2', 'utf16le', 'utf-16le'].includes(encoding)) {

    utf16Decode(data)

  } else if (encoding === 'base64') {

    Base64.toByteArray(data)
 
  } else if (encoding === 'base58') {

    Base58.decodeUnsafe(data)

  } else {

    throw new Error('Unknown Encoding Provided. Recieved Encoding "' + encoding + '"')

  }

}

function hexDecode (str) {

  const len = str.length >>> 1

  const byteArray = new Uint8Array(len)

  for (let i = 0; i < len; ++i) {
    byteArray[i] = decLookupTable[str.substr(i * 2, 2)]
  }
  return byteArray
}
function latinDecode (str) {
  const byteArray = new Uint8Array(str.length)
  for (let i = 0; i < str.length; i++) {
    byteArray[i] = str.charCodeAt(i)
  }
  return byteArray
}
function utf8Decode (string) {
  let units = Infinity
  let codePoint
  const length = string.length
  let leadSurrogate = null
  const bytes = []
  for (let i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      if (!leadSurrogate) {
        if (codePoint > 0xDBFF) {
          bytes.push(0xEF)
          bytes.push(0xBF)
          bytes.push(0xBD)
          continue
        } else if (i + 1 === length) {
          bytes.push(0xEF)
          bytes.push(0xBF)
          bytes.push(0xBD)
          continue
        }
        leadSurrogate = codePoint
        continue
      }
      if (codePoint < 0xDC00) {
        bytes.push(0xEF)
        bytes.push(0xBF)
        bytes.push(0xBD)
        leadSurrogate = codePoint
        continue
      }
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      bytes.push(0xEF)
      bytes.push(0xBF)
      bytes.push(0xBD)
    }
    leadSurrogate = null
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
        bytes.push(codePoint >> 0x6 | 0xC0)
        bytes.push(codePoint & 0x3F | 0x80)
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
        bytes.push(codePoint >> 0xC | 0xE0)
        bytes.push(codePoint >> 0x6 & 0x3F | 0x80)
        bytes.push(codePoint & 0x3F | 0x80)
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
        bytes.push(codePoint >> 0x12 | 0xF0)
        bytes.push(codePoint >> 0xC & 0x3F | 0x80)
        bytes.push(codePoint >> 0x6 & 0x3F | 0x80)
        bytes.push(codePoint & 0x3F | 0x80)
    } else {
      throw new Error('Invalid code point')
    }
  }
  const uint8 = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) {
    uint8[i] = bytes[i]
  }
  return uint8
}
function utf16Decode (str) {
  let c, hi, lo
  const byteArray = new Uint8Array(str.length * 2)
  let pos = 0
  for (let i = 0; i < str.length; ++i) {
    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray[pos] = lo
    byteArray[pos + 1] = hi
    pos = pos + 2
  }
  return byteArray
}

function base () {
  let ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  if (ALPHABET.length >= 255) { throw new TypeError('Alphabet too long') }
  let BASE_MAP = new Uint8Array(256)
  for (let j = 0; j < BASE_MAP.length; j++) {
    BASE_MAP[j] = 255
  }
  for (let i = 0; i < ALPHABET.length; i++) {
    let x = ALPHABET.charAt(i)
    let xc = x.charCodeAt(0)
    if (BASE_MAP[xc] !== 255) { throw new TypeError(x + ' is ambiguous') }
    BASE_MAP[xc] = i
  }
  let BASE = ALPHABET.length
  let LEADER = ALPHABET.charAt(0)
  let FACTOR = Math.log(BASE) / Math.log(256)
  let iFACTOR = Math.log(256) / Math.log(BASE)
  function encode (source) {
    if (source.length === 0) { return '' }
    let zeroes = 0
    let length = 0
    let pbegin = 0
    let pend = source.length
    while (pbegin !== pend && source[pbegin] === 0) {
      pbegin++
      zeroes++
    }
    let size = ((pend - pbegin) * iFACTOR + 1) >>> 0
    let b58 = new Uint8Array(size)
    while (pbegin !== pend) {
      let carry = source[pbegin]
      let i = 0
      for (let it1 = size - 1; (carry !== 0 || i < length) && (it1 !== -1); it1--, i++) {
        carry += (256 * b58[it1]) >>> 0
        b58[it1] = (carry % BASE) >>> 0
        carry = (carry / BASE) >>> 0
      }
      if (carry !== 0) { throw new Error('Non-zero carry') }
      length = i
      pbegin++
    }
    let it2 = size - length
    while (it2 !== size && b58[it2] === 0) {
      it2++
    }
    let str = LEADER.repeat(zeroes)
    for (; it2 < size; ++it2) { str += ALPHABET.charAt(b58[it2]) }
    return str
  }
  function decodeUnsafe (source) {
    if (typeof source !== 'string') { throw new TypeError('Expected String') }
    if (source.length === 0) { return new Uint8Array(0) }
    let psz = 0
    if (source[psz] === ' ') { return }
    let zeroes = 0
    let length = 0
    while (source[psz] === LEADER) {
      zeroes++
      psz++
    }
    let size = (((source.length - psz) * FACTOR) + 1) >>> 0
    let b256 = new Uint8Array(size)
    while (source[psz]) {
      let carry = BASE_MAP[source.charCodeAt(psz)]
      if (carry === 255) { return }
      let i = 0
      for (let it3 = size - 1; (carry !== 0 || i < length) && (it3 !== -1); it3--, i++) {
        carry += (BASE * b256[it3]) >>> 0
        b256[it3] = (carry % 256) >>> 0
        carry = (carry / 256) >>> 0
      }
      if (carry !== 0) { throw new Error('Non-zero carry') }
      length = i
      psz++
    }
    if (source[psz] === ' ') { return }
    let it4 = size - length
    while (it4 !== size && b256[it4] === 0) {
      it4++
    }
    let vch = new Uint8Array(zeroes + (size - it4))
    vch.fill(0x00, 0, zeroes)
    let j = zeroes
    while (it4 !== size) {
      vch[j++] = b256[it4++]
    }
    return vch
  }
  function decode (string) {
    let buffer = decodeUnsafe(string)
    if (buffer) { return buffer }
    throw new Error('Non-base' + BASE + ' character')
  }
  return {
    encode: encode,
    decodeUnsafe: decodeUnsafe,
    decode: decode
  }
}

module.exports = Bitray