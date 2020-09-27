const parseDomain = require('parse-domain').parseDomain

const ovh = require('ovh')({
  endpoint: process.env.OVH_ENDPOINT || 'ovh-eu',
  consumerKey: process.env.OVH_CUSTOMER_KEY,
  appKey: process.env.OVH_APP_KEY,
  appSecret: process.env.OVH_APP_SECRET
})

module.exports = async function deleteChallenge (domainToValidate, fullRecord, challengeToken) {
  const dom = parseDomain(domainToValidate)
  const secondLevelDomain = dom && dom.domain && dom.topLevelDomains.length ? `${dom.domain}.${dom.topLevelDomains.join('.')}` : ''
  const acmeRecord = fullRecord.substring(0, fullRecord.indexOf(secondLevelDomain) - 1)

  try {
    const options = {
      fieldType: 'TXT',
      subDomain: `${acmeRecord}`
    }

    const records = await ovh.requestPromised('GET', `/domain/zone/${secondLevelDomain}/record`, options)

    if (records.length < 1) {
      process.exit(0)
    }

    await ovh.requestPromised('DELETE', `/domain/zone/${secondLevelDomain}/record/${records[0]}`)
    await ovh.requestPromised('POST', `/domain/zone/${secondLevelDomain}/refresh`)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}
