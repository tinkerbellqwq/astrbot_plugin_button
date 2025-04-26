import pb from "./protobuf/index.js"
import {
  Buffer
} from 'buffer'
import crypto from 'crypto'
import {
  gzip as _gzip,
  gunzip as _gunzip
} from 'zlib'
import {
  promisify
} from 'util'

const gzip = promisify(_gzip)
const gunzip = promisify(_gunzip)

const RandomUInt = () => crypto.randomBytes(4).readUInt32BE()

export const Proto = pb

export const replacer = (key, value) => {
  if (typeof value !== 'bigint') return value
  return Number(value) >= Number.MAX_SAFE_INTEGER ? value.toString() : Number(value)
}

export const encode = (json) => {
  return pb.encode(processJSON(json))
}


function processJSON(json, path = []) {
  const result = {}
  if (Buffer.isBuffer(json) || json instanceof Uint8Array) {
    return json
  } else if (Array.isArray(json)) {
    return json.map((item, index) => processJSON(item, path.concat(index + 1)))
  } else if (typeof json === "object" && json !== null) {
    for (const key in json) {
      const numKey = Number(key)
      if (Number.isNaN(numKey)) {
        throw new Error(`Key is not a valid integer: ${key}`)
      }
      const currentPath = path.concat(key)
      const value = json[key]

      if (typeof value === "object" && value !== null) {
        if (Array.isArray(value)) {
          result[numKey] = value.map((item, idx) =>
            processJSON(item, currentPath.concat(String(idx + 1)))
          )
        } else {
          result[numKey] = processJSON(value, currentPath)
        }
      } else {
        if (typeof value === "string") {
          if (value.startsWith("hex->")) {
            const hexStr = value.slice("hex->".length)
            if (isHexString(hexStr)) {
              result[numKey] = hexStringToByteArray(hexStr)
            } else {
              result[numKey] = value
            }
          } else if (
            currentPath.slice(-2).join(",") === "5,2" &&
            isHexString(value)
          ) {
            result[numKey] = hexStringToByteArray(value)
          } else {
            result[numKey] = value
          }
        } else {
          result[numKey] = value
        }
      }
    }
  } else {
    return json
  }
  return result
}

function isHexString(s) {
  return s.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(s)
}

function hexStringToByteArray(s) {
  return Buffer.from(s, "hex")
}

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}