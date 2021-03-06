const { App, ExpressReceiver } = require('@slack/bolt')
const scopes = require('./server/slack/scopes.js')
const { v4: uuidv4 } = require('uuid')
const {
  storeInstall,
  fetchInstall,
  saveState,
  getState
} = require('./server/dynamodb/dynamodb.js')
const next = require('next')
const dev = process.env.NODE_ENV !== 'production'
const nextApp = next({ dev })
const handle = nextApp.getRequestHandler()

const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  scopes,
  installationStore: {
    storeInstallation: async installation => {
      return storeInstall(installation.team.id, installation)
    },
    fetchInstallation: async InstallQuery => {
      return fetchInstall(InstallQuery.teamId)
    }
  },
  installerOptions: {
    stateStore: {
      generateStateParam: async (installUrlOptions, date) => {
        const randomState = uuidv4()
        await saveState(randomState, installUrlOptions)
        return randomState
      },
      verifyStateParam: async (date, state) => {
        const installUrlOptions = await getState(state)
        return installUrlOptions
      }
    }
  }
})

// Create the Bolt App, using the receiver
const app = new App({
  receiver,
  signingSecret: process.env.SLACK_SIGNING_SECRET
})

nextApp.prepare().then(() => {
  app.message(/^(PII|Pii|pii).*/, async ({ context, say }) => {
    const term = context.matches[0]
    await say(
      `It looks like you used the term '${term}', did you mean personal data?`
    )
  })

  app.command('/personaldatabot', async ({ command, ack, say }) => {
    await ack()
    await say(`${command.text}`)
  })

  receiver.router.get('/install', async (req, res) => {
    let url = await receiver.installer.generateInstallUrl({
      scopes
    })
    res.status(200).json(url)
  })

  receiver.router.get('/slack/custom_oauth_redirect', (req, res) => {
    receiver.installer.handleCallback(req, res, {
      success: (installation, installOptions, req, res) => {
        return nextApp.render(req, res, '/success')
      },
      failure: (error, installOptions, req, res) => {
        return nextApp.render(req, res, '/error')
      }
    })
  })

  receiver.router.get('/', async (req, res) => {
    return nextApp.render(req, res, '/')
  })

  receiver.router.get('*', (req, res) => {
    return handle(req, res)
  })
  ;(async () => {
    // Start your app
    await app.start(process.env.PORT || 7000)
    console.log('⚡️ Bolt app is running!')
  })()
})
