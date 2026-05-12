# alexa-wake-on-lan

Serverless Alexa Smart Home skill that wakes a home PC ("Ronin") via Wake-on-LAN.
Voice command: "Alexa, turn on Ronin."

No local bridge server, no open router ports, no subscription service.

## Architecture

Uses the `Alexa.WakeOnLANController` interface. Lambda handles device discovery only —
returns the PC's MAC address. Alexa instructs the local Echo device to broadcast the
magic packet on the LAN. The cloud never touches the LAN directly.

## Key values

| Key | Value |
|---|---|
| PC friendly name | `Ronin` |
| MAC address | `REDACTED` |
| Lambda runtime | Node.js 20.x or Python 3.12 (undecided) |
| Lambda architecture | arm64 |

MAC address must be stored as a Lambda environment variable (`MAC_ADDRESS`), not hardcoded.
Friendly name stored as `PC_FRIENDLY_NAME` env var.

## Lambda handler

Responds to exactly two directive namespaces:

1. **`Alexa.Discovery` / `Discover`** — return the PC as a discoverable endpoint with two
   interfaces: `Alexa.WakeOnLANController` (with `MACAddresses`) and `Alexa.PowerController`

2. **`Alexa.ReportState`** — return power state as `OFF` (PC is off when WoL is needed;
   Lambda can't ping it; OFF is honest and correct)

Alexa DOES send a `TurnOn` directive even for WoL devices. The Lambda must respond with
a success `Alexa.Response` or Alexa will say "not responding." Alexa also broadcasts the
magic packet to the local Echo independently. No WoL library needed in the Lambda.

## Lambda resource policy

Allow Alexa to invoke the function:
- Principal: `alexa-connectedhome.amazon.com`
- Action: `lambda:InvokeFunction`

## OAuth / Account Linking

- Provider: Login with Amazon (LWA)
- Authorization URI: `https://www.amazon.com/ap/oa`
- Access Token URI: `https://api.amazon.com/auth/o2/token`
- Scope: `profile`
- Redirect URLs: shown in Alexa Developer Console during skill setup; add to LWA profile

## Repo structure

```
alexa-wake-on-lan/
├── README.md
├── CONTEXT.md          ← gitignored, not for Claude
├── CLAUDE.md
├── .gitignore
└── src/
  └── index.js          ← Lambda handler (or handler.py)
```

## Project status

- [x] AWS account created (free tier)
- [x] Amazon Developer account created
- [x] MAC address known
- [x] README.md written
- [ ] GitHub repo created (`alexa-wake-on-lan`)
- [ ] LWA security profile created
- [ ] Lambda function written and deployed
- [ ] Alexa skill created in Developer Console
- [ ] Account linking configured
- [ ] End-to-end test

## Next steps (in order)

1. Create GitHub repo `alexa-wake-on-lan`, push README.md
2. Create LWA security profile in Amazon Developer Console
3. Create Alexa Smart Home skill, note redirect URLs, paste into LWA profile
4. Write and deploy Lambda handler
5. Configure account linking in skill
6. Enable skill in Alexa app, link account, discover devices
7. Test: "Alexa, turn on Ronin"
