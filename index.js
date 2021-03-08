class Bitray extends Uint8Array {

  constructor(data, encoding) {

    let binary

    if (typeof encoding !== 'string' || encoding === '') {

      encoding = 'utf8'

    }

    if (encoding === 'utf8' || encoding === 'utf-8') {
        
      binary = utf8Decode(data)

    } else if (['latin1', 'binary'].includes(encoding)) {
        
      binary = latinDecode(data)

    } else if (encoding === 'hex') {
        
      binary = hexDecode(data)

    } else if (['ucs2', 'ucs-2', 'utf16le', 'utf-16le'].includes(encoding)) {

      binary = utf16Decode(data)

    } else if (encoding === 'base64') {

      binary = toByteArray(data)

      console.log('toByteArray', toByteArray(data))

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

      let ret = ''
    
      for (let i = 0; i < this.binary.length; ++i) {

        ret += this.binary[i].toString(16)

      }

      return ret

    }

    if (['ucs2', 'ucs-2', 'utf16le', 'utf-16le'].includes(encoding)) {

      let res = ''
      
      for (let i = 0; i < this.binary.length - 1; i += 2) {

        res += String.fromCharCode(this.binary[i] + (this.binary[i + 1] * 256))

      }

      return res

    }

    if (encoding === 'base64') {

      return fromByteArray(this.binary)

    }

  }

}

let lookup = []
let revLookup = []
let code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (let i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code.charAt(i)
  revLookup[code.charCodeAt(i)] = i
}
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  let len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }
  let validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len
  let placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  const uin8 = new Uint8Array(2)
  uin8[0] = validLen
  uin8[1] = placeHoldersLen

  return uin8
}

function toByteArray (b64) {
  let tmp
  let lens = getLens(b64)
  let validLen = lens[0]
  let placeHoldersLen = lens[1]
  let arr = new Uint8Array(((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen)
  let curByte = 0
  let len = placeHoldersLen > 0
    ? validLen - 4
    : validLen
  let i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }
  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }
  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }
  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  let tmp
  let output = []
  for (let i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  let tmp
  let len = uint8.length
  let extraBytes = len % 3
  let parts = []
  let maxChunkLength = 16383
  for (let i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }
  return parts.join('')
}

function hexDecode (str) {
  const byteArray = new Uint8Array(str.length >>> 1)
  const strArray = str.split('')
  let pos = 0
  for (let i = 0; i < str.length / 2; ++i) {
      let hex = '' + strArray[pos] + '' + strArray[pos + 1] + ''
      byteArray[i] = parseInt('0x' + hex + '', 16)
      pos = pos + 2
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
          if ((units -= 3) > -1) {
            bytes.push(0xEF)
            bytes.push(0xBF)
            bytes.push(0xBD)
          }
          continue
        } else if (i + 1 === length) {
          if ((units -= 3) > -1) {
            bytes.push(0xEF)
            bytes.push(0xBF)
            bytes.push(0xBD)
          }
          continue
        }
        leadSurrogate = codePoint
        continue
      }
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) {
          bytes.push(0xEF)
          bytes.push(0xBF)
          bytes.push(0xBD)
        }
        leadSurrogate = codePoint
        continue
      }
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      if ((units -= 3) > -1) {
        bytes.push(0xEF)
        bytes.push(0xBF)
        bytes.push(0xBD)
      }
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

module.exports = Bitray