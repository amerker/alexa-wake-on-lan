const MAC_ADDRESS = process.env.MAC_ADDRESS;
const PC_FRIENDLY_NAME = process.env.PC_FRIENDLY_NAME ?? "Ronin";
const ENDPOINT_ID = "ronin-pc-001";

export const handler = async (event) => {
  const namespace = event?.directive?.header?.namespace;
  const name = event?.directive?.header?.name;

  if (namespace === "Alexa.Discovery" && name === "Discover") {
    return handleDiscovery(event);
  }

  if (namespace === "Alexa" && name === "ReportState") {
    return handleReportState(event);
  }

  throw new Error(`Unhandled directive: ${namespace}/${name}`);
};

function handleDiscovery(event) {
  return {
    event: {
      header: {
        namespace: "Alexa.Discovery",
        name: "Discover.Response",
        payloadVersion: "3",
        messageId: event.directive.header.messageId,
      },
      payload: {
        endpoints: [
          {
            endpointId: ENDPOINT_ID,
            friendlyName: PC_FRIENDLY_NAME,
            description: "Wake-on-LAN PC",
            manufacturerName: "Custom",
            displayCategories: ["COMPUTER"],
            capabilities: [
              {
                type: "AlexaInterface",
                interface: "Alexa.WakeOnLANController",
                version: "3",
                properties: {},
                configuration: {
                  MACAddresses: [MAC_ADDRESS],
                },
              },
              {
                type: "AlexaInterface",
                interface: "Alexa.PowerController",
                version: "3",
                properties: {
                  supported: [{ name: "powerState" }],
                  retrievable: true,
                  proactivelyReported: false,
                },
              },
              {
                type: "AlexaInterface",
                interface: "Alexa",
                version: "3",
              },
            ],
          },
        ],
      },
    },
  };
}

function handleReportState(event) {
  const { correlationToken, messageId } = event.directive.header;
  const endpointId = event.directive.endpoint.endpointId;

  return {
    context: {
      properties: [
        {
          namespace: "Alexa.PowerController",
          name: "powerState",
          value: "ON",
          timeOfSample: new Date().toISOString(),
          uncertaintyInMilliseconds: 0,
        },
      ],
    },
    event: {
      header: {
        namespace: "Alexa",
        name: "StateReport",
        payloadVersion: "3",
        messageId,
        correlationToken,
      },
      endpoint: { endpointId },
      payload: {},
    },
  };
}
