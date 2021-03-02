const crypto = require('crypto')

const json = {
  stringify: (obj, replacer, spacing) => JSON.stringify(obj, replacer || null, spacing || 2),
  parse: JSON.parse
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
      const iv = crypto.randomBytes(16)
      const cipher = crypto.createCipheriv(this.alg, this.key, iv)
      let value = cipher.update(this.format.stringify(data[key]), 'utf8', 'hex')
      value += cipher.final('hex')
      const authTag = cipher.getAuthTag().toString('hex')

      acc[key] = {
        alg: this.alg,
        authTag,
        iv: iv.toString('hex'),
        value
      }
      return acc
    }, {})
  }
  decrypt(data) {
    return Object.keys(data).reduce((acc, key) => {
      const {
        alg = this.alg,
        authTag,
        iv = this.iv,
        value
      } = data[key]

      const decipher = crypto.createDecipheriv(alg, this.key, Buffer.from(iv, 'hex'))
      decipher.setAuthTag(Buffer.from(authTag, 'hex'))
      let decrypted = decipher.update(value, 'hex','utf8')
      decrypted += decipher.final('utf8')

      acc[key] = this.format.parse(decrypted)
      return acc
    }, {})
  }
}

module.exports = Secure
