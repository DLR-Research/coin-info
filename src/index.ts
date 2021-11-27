import fastify from 'fastify'
import { toChecksumAddress } from 'ethereum-checksum-address'
import fs from 'fs'

const BLOCKCHAINS_DIR = './assets/blockchains'

const chains: string[] = fs.readdirSync(BLOCKCHAINS_DIR)
const valid_chains: string[] = chains.filter(
  chain => fs.readdirSync(`${ BLOCKCHAINS_DIR }/${ chain }`).includes('assets')
)

const server = fastify()

type TokenRequestParams = {
  chain: string
  contract: string
  resource: string
}

server.get('/:chain/:contract/:resource', async (req, res) => {
  const { chain, contract, resource } = req.params as TokenRequestParams

  if (!valid_chains.includes(chain)) {
    res.code(400).send('unsupported chain')
  }

  if (!(resource === 'logo' || resource === 'info')) {
    res.code(400).send('unsupported resource type')
  }

  const corrected_contract = chain === 'ethereum'
    ? toChecksumAddress(contract)
    : contract

  const contract_path = `${ BLOCKCHAINS_DIR }/${ chain }/assets/${ corrected_contract }`

  try {
    if (resource === 'info') {
      const stream = fs.createReadStream(`${ contract_path }/info.json`)
      res.type('text/json').send(stream)
    } else {
      const stream = fs.createReadStream(`${ contract_path }/logo.png`)
      res.type('image/png').send(stream)
    }
  } catch (e) {
    res.code(400).send('contract not found')
  }
})

async function start() {
  try {
    await server.listen(process.env.PORT as string)
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()

