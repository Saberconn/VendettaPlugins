import {before} from "@vendetta/patcher";
import {ReactNative} from "@vendetta/metro/common";
import {findByStoreName} from "@vendetta/metro";

const {DCDChatManager} = ReactNative.NativeModules;
const UserStore = findByStoreName("UserStore");

const unpatch = before("updateRows", DCDChatManager, (args) => {
  const rows = JSON.parse(args[1]);

  for (const row of rows) {
    if (row.type !== 1 || !row?.message?.username || !row?.message?.authorId)
      continue;

    const message = row.message;

    const user = UserStore.getUser(message.authorId);
    if (!user) continue;
    const oldUsername = message.username;

    if (oldUsername != user.username) {
      message.username += " (" + user.tag + ")";
    } else {
      message.username += "#" + user.discriminator;
    }

    if (message.referencedMessage) {
      const message = row.message.referencedMessage.message;
      const user = UserStore.getUser(message.authorId);
      const oldUsername = message.username.replace("@", "");

      if (user != null) {
        if (oldUsername != user.username) {
          message.username += " (" + user.tag + ")";
        } else {
          message.username += "#" + user.discriminator;
        }
      }
    }
  }

  args[1] = JSON.stringify(rows);
});

export const onUnload = () => {
  unpatch();
};
