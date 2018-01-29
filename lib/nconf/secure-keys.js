const crypto = require('crypto')

const json = {
  stringify: (obj, replacer, spacing) => JSON.stringify(obj, replacer || null, spacing || 2),
  parse: JSON.parse
}

const cipherConvert = (contents, {encs: {input, output}, alg, key, iv}) => {
  const cipher = crypto.createCipheriv(alg, key, iv)
  return cipher.update(contents, input, output) + cipher.final(output)
}


class Secure {
  constructor({key, iv, alg = 'aes-256-gcm', format = json} = {}) {
    this.key = key
    this.iv = iv
    this.alg = alg
    this.format = format
    if (!key) {
      throw new Error('key is required')
    }
    if (!alg) {
      throw new Error('alg is required')
    }
  }
  encrypt(data) {
    return Object.keys(data).reduce((acc, key) => {
      acc[key] = {
        alg: this.alg,
        value: cipherConvert(this.format.stringify(data[key]), {
          alg: this.alg,
          key: this.key,
          iv: this.iv,
          encs: {
            input: 'utf8',
            output: 'hex'
          }
        })
      }
      return acc
    }, {})
  }
  decrypt(data) {
    return Object.keys(data).reduce((acc, key) => {
      const decrypted = cipherConvert(data[key].value, {
        alg: data[key].alg || this.alg,
        key: this.key,
        iv: this.iv,
        encs: {
          input: 'hex',
          output: 'utf8'
        }
      })
      acc[key] = this.format.parse(decrypted)
      return acc
    }, {})
  }
}

module.exports = Secure
