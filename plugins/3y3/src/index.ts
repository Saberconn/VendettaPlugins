import {after} from "@vendetta/patcher";
import {findByName, findByProps} from "@vendetta/metro";
import {ReactNative} from "@vendetta/metro/common";
import {registerCommand} from "@vendetta/commands";

const RowManager = findByName("RowManager");
const MarkupUtils = findByProps("parseToAST");

// FIXME: remove when upstream fixes types not getting exported
enum ApplicationCommandInputType {
  BUILT_IN,
  BUILT_IN_TEXT,
  BUILT_IN_INTEGRATION,
  BOT,
  PLACEHOLDER,
}

enum ApplicationCommandOptionType {
  SUB_COMMAND = 1,
  SUB_COMMAND_GROUP,
  STRING,
  INTEGER,
  BOOLEAN,
  USER,
  CHANNEL,
  ROLE,
  MENTIONABLE,
  NUMBER,
  ATTACHMENT,
}

enum ApplicationCommandType {
  CHAT = 1,
  USER,
  MESSAGE,
}

interface ASTNode {
  content: string | ASTNode[];
  type: string;
  target?: string;
  context?: Record<string, any>;
}

const patches: Function[] = [];

const REGEX_3Y3 = /([\u{e0020}-\u{e007e}]{1,})/u;

function parseNodes(nodes: ASTNode[], channelId: string) {
  for (const index in nodes) {
    const node = nodes[index];
    if (typeof node.content === "string") {
      if (REGEX_3Y3.test(node.content)) {
        const normal = node.content.replace(REGEX_3Y3, "");
        const [_, text] = node.content.match(REGEX_3Y3);
        nodes[index] = {
          content: normal,
          type: "text",
        };
        // NB: why are you implicitly a string
        nodes.splice(Number(index) + 1, 0, {
          content: [
            {
              content: MarkupUtils.parseToAST(
                [...text]
                  .map((char) =>
                    String.fromCodePoint(char.codePointAt(0) - 0xe0000)
                  )
                  .join(""),
                {channelId}
              ),
              type: "em",
            },
          ],
          type: "link",
          target: "usernameOnClick",
          context: {
            username: 1,
            usernameOnClick: {
              action: "0",
              userId: "0",
              linkColor: ReactNative.processColor("slateblue"),
              messageChannelId: "0",
            },
            medium: true,
          },
        });
      }
    } else if (Array.isArray(node.content)) {
      parseNodes(node.content, channelId);
    }
  }
}

export const onLoad = () => {
  patches.push(
    after("generate", RowManager.prototype, ([row], {message}) => {
      if (row.rowType !== 1) return;

      if (message.content) parseNodes(message.content, message.channelId);
    })
  );
  patches.push(
    registerCommand({
      name: "3y3",
      displayName: "3y3",
      description: "Second sight encoding",
      displayDescription: "Second sight encoding",
      type: ApplicationCommandType.CHAT as number,
      inputType: ApplicationCommandInputType.BUILT_IN_TEXT as number,
      applicationId: "-1",
      options: [
        {
          name: "message",
          displayName: "message",
          description: "What to encode",
          displayDescription: "What to encode",
          type: ApplicationCommandOptionType.STRING as number,
          required: true,
        },
        {
          name: "padding",
          displayName: "padding",
          description: "Optional padded message",
          displayDescription: "Optional padded message",
          type: ApplicationCommandOptionType.STRING as number,
          required: false,
        },
      ],
      execute: (args, ctx) => {
        const message = args.find((x) => x.name == "message")?.value;
        const padding = args.find((x) => x.name == "padding")?.value ?? "";

        const encoded = Array.from(message)
          .map((x: string) => x.codePointAt(0))
          .filter((x: number) => x >= 0x20 && x <= 0x7f)
          .map((x: number) => String.fromCodePoint(x + 0xe0000))
          .join("");

        return {
          content: (padding ?? "") + " " + encoded,
        };
      },
    })
  );
};

export const onUnload = () => {
  for (const unpatch of patches) {
    unpatch?.();
  }
};
