#!/usr/bin/env node

const path = require('path')
const env = path.resolve(__dirname, '../.env')
require('dotenv').config({ path: env })

const createChallenge = require('./lib/create-challenge')
const deleteChallenge = require('./lib/delete-challenge')

const action = process.argv[2]
const identifier = process.argv[3]
const recordName = process.argv[4]
// const zoneName = process.argv[5]
// const nodeName = process.argv[6]
const token = process.argv[7]

if (action === 'create') {
  console.log(`Authenticating ${identifier} via DNS-01 challenge...`)
  createChallenge(recordName, token)
} else if (action === 'delete') {
  console.log(`Deleting challenge for ${identifier}...`)
  deleteChallenge(recordName)
}
