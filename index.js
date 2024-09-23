const path = require('path')
const debug = require('debug')('win-acme-dns-ovh:index')

// When the node process is executed in the context of wacs.exe, process.cwd() returns the directory where wacs.exe is
// located and dotenv's default path is `path.resolve(process.cwd(), '.env')`. We force it here.
require('dotenv').config({ path: path.resolve(__dirname, '.env') })

const createChallenge = require('./lib/create-challenge')
const deleteChallenge = require('./lib/delete-challenge')

const action = process.argv[2]
const identifier = process.argv[3]
const recordName = process.argv[4]
const token = process.argv[5]

if (action === 'create') {
  debug(`Authenticating ${identifier} via DNS-01 challenge...`)
  createChallenge(identifier, recordName, token)
} else if (action === 'delete') {
  debug(`Deleting challenge for ${identifier}...`)
  deleteChallenge(identifier, recordName)
}
