# alexa-wake-on-lan

> "Alexa, turn on [your PC]." — PC boots before you reach your desk.

A serverless Alexa Smart Home skill that wakes a home PC via Wake-on-LAN. No always-on server, no open router ports, no subscription.

---

## How it works

The skill uses Amazon's [`Alexa.WakeOnLANController`](https://developer.amazon.com/en-US/docs/alexa/device-apis/alexa-wakeonlancontroller.html) interface. The Lambda function handles device discovery and returns your PC's MAC address. Alexa then instructs your local Echo device to broadcast the magic packet directly on the LAN — the cloud never touches your network.

```
"Alexa, turn on [your PC]"
        │
        ▼
  Alexa Cloud calls Lambda
        │
        ▼
  Lambda returns MAC address
        │
        ▼
  Alexa instructs local Echo
        │
        ▼
  Echo broadcasts magic packet
        │
        ▼
  PC wakes up ✓
```

---

## Architecture decisions

### Why `Alexa.WakeOnLANController`

The alternative — Lambda calling a local HTTP endpoint or MQTT broker to send the magic packet — requires port-forwarding or a persistent tunnel, plus an always-on bridge device. `Alexa.WakeOnLANController` uses the Echo (already on your LAN, already always-on) to do the broadcast. No open ports, no bridge.

### Why not a ready-made skill

Services like SayBoot use the same mechanism and work well. The tradeoff: your PC's MAC address lives in their backend. This keeps everything in your own AWS account.

### Alternative: Fritzbox TR-064

AVM Fritzbox routers expose a TR-064 SOAP API (`X_AVM-DE_WakeOnLANByMACAddress`) accessible remotely via `myfritz.net`. Lambda can call it directly — no Echo required, no account linking. Better if you want non-Alexa triggers (scripts, shortcuts, automations). For pure voice use, `WakeOnLANController` is cleaner.

---

## Prerequisites

- AWS account (Lambda + CloudWatch)
- Amazon Developer account
- Echo device on the same LAN as the target PC
- Wake-on-LAN enabled on the target PC (see below)

---

## Setup

### PC

1. Enable WoL in BIOS/UEFI ("Wake on LAN" or "Power on by PCI-E")
2. Device Manager → your network adapter → Power Management → enable "Wake on Magic Packet"
3. Disable Fast Startup (it prevents a full shutdown and breaks WoL)
4. Note the MAC address of your **wired** adapter via `ipconfig /all` — WoL doesn't work over Wi-Fi

### Login with Amazon (LWA) security profile

Alexa Smart Home skills require OAuth. LWA is Amazon's own provider — no external IdP needed.

1. [developer.amazon.com](https://developer.amazon.com) → Login with Amazon → create a security profile
   - The profile name cannot contain "Amazon", "AWS", or "Alexa" — use something like "Home PC Skill"
   - A Privacy Notice URL is required — host a simple page (e.g. via GitHub Pages) if you don't have one
2. Under Web Settings, add the redirect URLs shown in the Alexa Developer Console (step below)
3. Save the Client ID and Client Secret

### Lambda function

> **Region matters:** Alexa Smart Home only supports `us-east-1`, `us-west-2`, `eu-west-1`, and `ap-northeast-1`. Create your function in one of these — `eu-west-1` (Ireland) is the right choice for Europe.

1. Create a Lambda function (Node.js 20.x, `arm64`) in a supported region
2. Set environment variables:
   ```
   MAC_ADDRESS=AA:BB:CC:DD:EE:FF
   PC_FRIENDLY_NAME=YourPCName
   ```
3. Deploy the handler from [`src/index.js`](src/index.js) — paste into `index.mjs` in the inline editor
4. Add a resource-based policy allowing invocation:
   - Principal: `alexa-connectedhome.amazon.com`
   - Action: `lambda:InvokeFunction`

### Alexa skill

1. [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask) → Create Skill → Smart Home → Provision your own
2. Paste the Lambda ARN as the Default Endpoint
3. Configure Account Linking:
   - Authorization URI: `https://www.amazon.com/ap/oa`
   - Access Token URI: `https://api.amazon.com/auth/o2/token`
   - Client ID + Secret from your LWA profile
   - Authentication Scheme: HTTP Basic
   - Scope: `profile`
4. Copy the redirect URLs back into the LWA security profile

### Enable and discover

1. Alexa app → Skills → Your Skills → Dev → enable your skill → link account
2. "Alexa, discover devices"
3. "Alexa, turn on [your PC name]"

---

## Lambda overview

Three directives handled:

- **`Alexa.Discovery.Discover`** — returns the PC as an endpoint with `Alexa.WakeOnLANController` (MAC address) and `Alexa.PowerController` interfaces
- **`Alexa.PowerController.TurnOn`** — returns a success response with `powerState: ON`; Alexa also broadcasts the magic packet to the local Echo independently
- **`Alexa.ReportState`** — returns `powerState: ON`; Lambda has no way to ping the LAN, so this is optimistic but correct for the use case

No WoL library needed — the Echo handles the broadcast.

---

## Security

- Store the MAC address in a Lambda environment variable, not in source code
- No router ports are opened — the Echo broadcasts from inside the LAN

---

## License

MIT
