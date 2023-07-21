import {after, before} from "@vendetta/patcher";
import {findByName, findByProps, findByStoreName} from "@vendetta/metro";
import {ReactNative} from "@vendetta/metro/common";
import {storage} from "@vendetta/plugin";
import {rawColors, semanticColors} from "@vendetta/ui";

const RowManager = findByName("RowManager");
const ColorUtils = findByProps("int2hex");
const ThemeStore = findByStoreName("ThemeStore");
const {
  meta: {resolveSemanticColor},
} = findByProps("colors", "meta");
const GuildMemberStore = findByStoreName("GuildMemberStore");
const GuildStore = findByStoreName("GuildStore");
const MarkupUtils = findByProps("parseToAST");

function createUsername(
  message: Record<string, any>,
  rowMessage: Record<string, any>,
) {
  const out = [];
  const tagColor = ColorUtils.hex2int(
    message.tagBackgroundColor
      ? ColorUtils.int2hex(message.tagBackgroundColor)
      : rawColors.BRAND_500,
  );
  const timestampColor = ColorUtils.hex2int(
    resolveSemanticColor(ThemeStore.theme, semanticColors.TEXT_MUTED),
  );

  const member = GuildMemberStore.getMember(
    message.guildId,
    rowMessage.author.id,
  );
  const guild = GuildStore.getGuild(message.guildId);

  if (rowMessage.timestamp && !storage.noInline) {
    console.log(timestampColor);
    out.push({
      content: [
        {
          content: storage.inlineTimestamps
            ? rowMessage.__customTimestamp ?? rowMessage.timestamp.calendar()
            : rowMessage.timestamp.format("HH:mm:ss"),
          type: "text",
        },
      ],
      type: "mention",
      roleColor: timestampColor,
      color: timestampColor,
      colorString: ColorUtils.int2hex(timestampColor),
    });
    out.push({
      content: " ",
      type: "text",
    });
  }

  if (
    (storage.avatars ?? false) &&
    ReactNative.Platform.OS != "android" &&
    rowMessage.author.avatar != null
  ) {
    let avatarUrl = `https://cdn.discordapp.com/avatars/${
      rowMessage.author.id
    }/${rowMessage.author.avatar}.${
      rowMessage.author.avatar.startsWith("a_") ? "gif" : "png"
    }?size=128`;
    if (member?.avatar) {
      avatarUrl = `https://cdn.discordapp.com/guilds/${message.guildId}/users/${
        message.authorId
      }/avatars/${member.avatar}.${
        member.avatar.startsWith("a_") ? "gif" : "png"
      }?size=128`;
    }

    const avatarNode = {
      id: rowMessage.author.id,
      alt: "Avatar for: " + message.username,
      src: avatarUrl,
      frozenSrc: avatarUrl,
      type: "customEmoji",
    };
    out.push(avatarNode);
    out.push({
      content: " ",
      type: "text",
    });
  }

  if (message.tagText && !storage.noInline) {
    out.push({
      content: [
        {
          content: message.tagText,
          type: "text",
        },
      ],
      type: "mention",
      roleColor: tagColor,
      color: tagColor,
      colorString: ColorUtils.int2hex(tagColor),
    });
    out.push({
      content: " ",
      type: "text",
    });
  }

  const usernameNode = {
    content: [
      {
        content: [
          {
            content: message.username,
            type: "text",
          },
        ],
        type: "strong",
      },
    ],
    type: "link",
    target: "usernameOnClick",
    context: {
      username: true,
      usernameOnClick: {
        action: "bindTapUsername",
        userId: rowMessage.author.id,
        linkColor: rowMessage.colorString
          ? ReactNative.processColor(rowMessage.colorString)
          : message.usernameColor,
        messageChannelId: message.channelId,
      },
    },
  };
  out.push(usernameNode);

  if (member?.iconRoleId && storage.noInline) {
    const role = guild.roles[member.iconRoleId];
    if (role.unicodeEmoji) {
      out.push({
        content: " ",
        type: "text",
      });
      out.push(MarkupUtils.parseToAST(role.unicodeEmoji)[0]);
    } else if (role.icon && ReactNative.Platform.OS != "android") {
      const iconUrl = `https://cdn.discordapp.com/role-icons/${message.guildId}/${role.icon}.webp?size=20`;
      out.push({
        content: " ",
        type: "text",
      });
      out.push({
        id: role.id,
        alt: role.name,
        src: iconUrl,
        frozenSrc: iconUrl,
        type: "customEmoji",
      });
    }
  }

  if (message.tagText && storage.noInline) {
    out.push({
      content: " ",
      type: "text",
    });
    out.push({
      content: [
        {
          content: message.tagText,
          type: "text",
        },
      ],
      type: "mention",
      roleColor: tagColor,
      color: tagColor,
      colorString: ColorUtils.int2hex(tagColor),
    });
  }

  if (rowMessage.timestamp && storage.noInline) {
    out.push({
      content: " ",
      type: "text",
    });
    out.push({
      content: [
        {
          content:
            rowMessage.__customTimestamp ?? rowMessage.timestamp.calendar(),
          type: "text",
        },
      ],
      type: "mention",
      roleColor: timestampColor,
      color: timestampColor,
      colorString: ColorUtils.int2hex(timestampColor),
    });
  }

  return out;
}

function recurseNodeForEmojis(nodes: Record<string, any>[]) {
  for (const node of nodes) {
    if (node.type == "emoji" || node.type == "customEmoji") {
      node.jumboable = false;
    } else if (Array.isArray(node.content)) {
      recurseNodeForEmojis(node.content);
    }
  }
}

const patches: Function[] = [];

export const onLoad = () => {
  patches.push(
    before("generate", RowManager.prototype, ([row]) => {
      row.vd_cm_realIsFirst = row.isFirst;
      row.isFirst = false;
      //row.renderContentOnly = true;
      if (row.message) row.message.avatarURL = undefined;
    }),
  );
  patches.push(
    after("generate", RowManager.prototype, ([row], ret) => {
      if (row.rowType !== 1) return;

      const rowMessage = row.message;
      const {message} = ret;

      if (message.type != 0 && message.type != 19) return;

      ret.renderContentOnly = true;
      message.avatarURL = undefined;

      if (storage.noInline && !row.vd_cm_realIsFirst) return;
      const usernameNode = createUsername(message, rowMessage);

      if (message.content) {
        usernameNode.push({
          content: storage.noInline ? "\n" : " ",
          type: "text",
        });
      }
      message.content = [...usernameNode, ...(message.content ?? [])];
      if (!storage.noInline) recurseNodeForEmojis(message.content);
    }),
  );
};

export const onUnload = () => {
  for (const unpatch of patches) {
    unpatch?.();
  }
};

export {default as settings} from "./settings";
