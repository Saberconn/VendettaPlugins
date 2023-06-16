import {after} from "@vendetta/patcher";
import {findByName, findByStoreName} from "@vendetta/metro";

const RowManager = findByName("RowManager");
const UserStore = findByStoreName("UserStore");

let unpatch: Function;

export const onLoad = () => {
  unpatch = after("generate", RowManager.prototype, ([row], {message}) => {
    if (row.rowType !== 1) return;

    const user = UserStore.getUser(message.authorId);
    if (!user) return;
    if (user.bot && user.discriminator == "0000") return;

    if (user.discriminator == "0" && message.username != user.username) {
      message.username += " (@" + user.username + ")";
    } else {
      const oldUsername = message.username;

      if (oldUsername != user.username) {
        message.username += " (" + user.tag + ")";
      } else {
        message.username += "#" + user.discriminator;
      }
    }

    if (message.referencedMessage?.message?.username) {
      const replyMessage = message.referencedMessage.message;
      const user = UserStore.getUser(replyMessage.authorId);
      const oldUsername = replyMessage.username.replace("@", "");

      if (!user) return;
      if (user.bot && user.discriminator == "0000") return;

      if (user.discriminator == "0" && replyMessage.username != user.username) {
        replyMessage.username += " (@" + user.username + ")";
      } else {
        if (oldUsername != user.username) {
          replyMessage.username += " (" + user.tag + ")";
        } else {
          replyMessage.username += "#" + user.discriminator;
        }
      }
    }
  });
};

export const onUnload = () => {
  unpatch?.();
};
