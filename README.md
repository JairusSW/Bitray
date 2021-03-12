# Bitray 
**A Small Utility For Handling Binary Data**

## About
- Integrates With Buffer
- Small And Fast
- Works In Browser And Node
- Zero Dependencies

## Installation
```bash
~ npm install bitray --save
```

## Usage

**Basic Usage**
```js
const Bitray = require('bitray')

const bit = new Bitray('Hello World 🌎')

console.log(bit.toFormat('hex'))
```

**Buffer Integration**
```js
const Bitray = require('bitray')

const bit = new Bitray('Hello World 🌎')
// Convert To Buffer
const buffer = Buffer.from(bit)
//===> <Buffer 68 65 6c 6c ... >
```
## Encodings
Binray Supports The Following Encodings:
- **Utf-8**
- **Base64**
- **Hex**
- **Base58**
- **Binary/Latin1**
- **Ucs2**
- **Utf16**

## API

### new Bitray(string, format) -->> Uint8Array
Creates A New Bitray Instance. Built On Top Of Uint8Array.

### .toFormat(encoding) -->> String
Convert Bitray Into A String Encoding.

## Performance

**Encode Performance**
![Encode](https://cdn.discordapp.com/attachments/809146942302978078/820053976527142912/s2buJpDNfAAAAAElFTkSuQmCC.png)

**Decode Performance**
![Decode](https://cdn.discordapp.com/attachments/809146942302978078/820053937981751326/sYzJNHOhqkUAAAAASUVORK5CYII.png)