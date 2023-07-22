import {after, before} from "@vendetta/patcher";
import {findByName, findByProps, findByStoreName} from "@vendetta/metro";
import {ReactNative, i18n} from "@vendetta/metro/common";
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
  const tagColor =
    message.tagBackgroundColor ?? ReactNative.processColor(rawColors.BRAND_500);
  const timestampColor = ReactNative.processColor(
    resolveSemanticColor(ThemeStore.theme, semanticColors.TEXT_MUTED),
  );

  const member = GuildMemberStore.getMember(
    message.guildId,
    rowMessage.author.id,
  );
  const guild = GuildStore.getGuild(message.guildId);

  if (rowMessage.timestamp && !storage.noInline) {
    out.push({
      content: [
        {
          content: storage.inlineTimestamps
            ? rowMessage.__customTimestamp ?? rowMessage.timestamp.calendar()
            : rowMessage.timestamp.format("HH:mm:ss"),
          type: "inlineCode",
        },
      ],
      type: "link",
      target: "usernameOnClick",
      context: {
        username: 1,
        usernameOnClick: {
          action: "0",
          userId: "0",
          linkColor: timestampColor,
          messageChannelId: "0",
        },
        medium: true,
      },
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
          type: "inlineCode",
        },
      ],
      type: "link",
      target: "usernameOnClick",
      context: {
        username: 1,
        usernameOnClick: {
          action: "0",
          userId: "0",
          linkColor: tagColor,
          messageChannelId: "0",
        },
        medium: true,
      },
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
          type: "inlineCode",
        },
      ],
      type: "link",
      target: "usernameOnClick",
      context: {
        username: 1,
        usernameOnClick: {
          action: "0",
          userId: "0",
          linkColor: tagColor,
          messageChannelId: "0",
        },
        medium: true,
      },
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
          type: "inlineCode",
        },
      ],
      type: "link",
      target: "usernameOnClick",
      context: {
        username: 1,
        usernameOnClick: {
          action: "0",
          userId: "0",
          linkColor: timestampColor,
          messageChannelId: "0",
        },
        medium: true,
      },
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

      if (message.referencedMessage?.message && storage.noReplyAvatars) {
        const replyMessage = message.referencedMessage.message;
        replyMessage.avatarURL = undefined;
        const usernameNode = {
          content: [
            {
              content: [
                {
                  content: replyMessage.username,
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
              userId: replyMessage.authorId,
              linkColor: replyMessage.usernameColor,
              messageChannelId: replyMessage.channelId,
            },
          },
        };

        if (
          replyMessage.attachments?.length > 0 &&
          message.referencedMessage.systemContent
        ) {
          delete message.referencedMessage.systemContent;
          if (!replyMessage.content) {
            replyMessage.content = [
              {
                content: [
                  {
                    content: i18n.Messages.REPLY_QUOTE_NO_TEXT_CONTENT_MOBILE,
                    type: "text",
                  },
                ],
                type: "em",
              },
            ];
          }

          // using .push triggers some caching thing and the emoji duplicates
          // every channel load
          replyMessage.content = [
            ...replyMessage.content,
            {content: " ", type: "text"},
            MarkupUtils.parseToAST("\u{1f5bc}")[0],
          ];
        }

        replyMessage.content = [
          usernameNode,
          {content: " ", type: "text"},
          ...(replyMessage.content ?? []),
        ];
      }
    }),
  );
};

export const onUnload = () => {
  for (const unpatch of patches) {
    unpatch?.();
  }
};

export {default as settings} from "./settings";
