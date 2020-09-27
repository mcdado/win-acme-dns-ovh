#!/usr/bin/env node

require('dotenv').config()

const createChallenge = require('./lib/create-challenge')
const deleteChallenge = require('./lib/delete-challenge')

const action = process.argv[2]
const identifier = process.argv[3]
const recordName = process.argv[4]
const token = process.argv[5]

if (action === 'create') {
  console.log(`Authenticating ${identifier} via DNS-01 challenge...`)
  createChallenge(identifier, recordName, token)
} else if (action === 'delete') {
  console.log(`Deleting challenge for ${identifier}...`)
  deleteChallenge(identifier, recordName)
}
