import {after} from "@vendetta/patcher";
import {findByName, findByStoreName} from "@vendetta/metro";
import {storage} from "@vendetta/plugin";
import {pastelize} from "./util";

const RowManager = findByName("RowManager");
const MessageStore = findByStoreName("MessageStore");

let unpatch: Function;

function processMessage(message: Record<string, any>) {
  const realMessage = MessageStore.getMessage(message.channelId, message.id);

  const pastelizeAll = storage.pastelizeAll ?? false;
  const webhookName = storage.webhookName ?? true;
  const pastelizeContent = storage.pastelizeContent ?? false;

  let toHash: string | null;
  if (realMessage?.webhookId) {
    if (webhookName) {
      toHash = message.username;
    } else {
      toHash = realMessage.webhookId;
    }
  } else {
    if ((!message.roleColor && !pastelizeAll) || pastelizeAll) {
      toHash = message.authorId;
    }
  }

  if (toHash) {
    const color = pastelize(toHash);
    message.roleColor = color;
    message.usernameColor = color;
    message.colorString = color;

    if (pastelizeContent && message.content) {
      const messageColor = pastelize(toHash, 0.85, 0.75);
      message.content = [
        {
          content: message.content,
          type: "link",
          target: "usernameOnClick",
          context: {
            username: 1,
            usernameOnClick: {
              action: "0",
              userId: "0",
              linkColor: messageColor,
              messageChannelId: "0",
            },
            medium: true,
          },
        },
      ];
    }
  }
}

export const onLoad = () => {
  unpatch = after("generate", RowManager.prototype, ([row], {message}) => {
    if (row.rowType !== 1) return;

    processMessage(message);

    if (message.referencedMessage?.message) {
      processMessage(message.referencedMessage.message);
    }
  });
};

export const onUnload = () => {
  unpatch?.();
};

export {default as settings} from "./settings";
