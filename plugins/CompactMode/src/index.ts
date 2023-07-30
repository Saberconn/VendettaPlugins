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

enum MessageTypes {
  DEFAULT,
  RECIPIENT_ADD,
  RECIPIENT_REMOVE,
  CALL,
  CHANNEL_NAME_CHANGE,
  CHANNEL_ICON_CHANGE,
  CHANNEL_PINNED_MESSAGE,
  USER_JOIN,
  GUILD_BOOST,
  GUILD_BOOST_TIER_1,
  GUILD_BOOST_TIER_2,
  GUILD_BOOST_TIER_3,
  CHANNEL_FOLLOW_ADD,
  GUILD_STREAM,
  GUILD_DISCOVERY_DISQUALIFIED,
  GUILD_DISCOVERY_REQUALIFIED,
  GUILD_DISCOVERY_GRACE_PERIOD_INITIAL_WARNING,
  GUILD_DISCOVERY_GRACE_PERIOD_FINAL_WARNING,
  THREAD_CREATED,
  REPLY,
  CHAT_INPUT_COMMAND,
  THREAD_STARTER_MESSAGE,
  GUILD_INVITE_REMINDER,
  CONTEXT_MENU_COMMAND,
  AUTO_MODERATION_ACTION,
  ROLE_SUBSCRIPTION_PURCHASE,
  INTERACTION_PREMIUM_UPSELL,
  STAGE_START,
  STAGE_END,
  STAGE_SPEAKER,
  STAGE_RAISE_HAND,
  STAGE_TOPIC,
  GUILD_APPLICATION_PREMIUM_SUBSCRIPTION,
  PRIVATE_CHANNEL_INTEGRATION_ADDED,
  PRIVATE_CHANNEL_INTEGRATION_REMOVED,
  PREMIUM_REFERRAL,
  GUILD_INCIDENT_ALERT_MODE_ENABLED,
  GUILD_INCIDENT_ALERT_MODE_DISABLED,
  GUILD_INCIDENT_REPORT_RAID,
  GUILD_INCIDENT_REPORT_FALSE_ALARM,
}

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

  if ((storage.avatars ?? false) && rowMessage.author.avatar != null) {
    let avatarUrl = `https://cdn.discordapp.com/avatars/${
      rowMessage.author.id
    }/${rowMessage.author.avatar}.${
      rowMessage.author.avatar.startsWith("a_") ? "gif" : "png"
    }?size=32`;
    if (member?.avatar) {
      avatarUrl = `https://cdn.discordapp.com/guilds/${message.guildId}/users/${
        message.authorId
      }/avatars/${member.avatar}.${
        member.avatar.startsWith("a_") ? "gif" : "png"
      }?size=32`;
    }

    const avatarNode = {
      guildId: "0",
      content: "",
      icon: avatarUrl,
      type: "guild",
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

  let name = message.username;
  if (message.username == rowMessage.author.username) {
    name = rowMessage.nick ?? rowMessage.author.globalName ?? message.username;
  }
  const usernameNode = {
    content: [
      {
        content: [
          {
            content: name,
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
    } else if (role.icon) {
      const iconUrl = `https://cdn.discordapp.com/role-icons/${member.iconRoleId}/${role.icon}.png?size=32`;
      out.push({
        content: " ",
        type: "text",
      });
      out.push({
        guildId: "0",
        content: "",
        icon: iconUrl,
        type: "guild",
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

      if (
        message.type != MessageTypes.DEFAULT &&
        message.type != MessageTypes.REPLY &&
        message.type != MessageTypes.CHAT_INPUT_COMMAND
      )
        return;

      ret.renderContentOnly = true;
      message.avatarURL = undefined;
      message.shouldShowRoleOnName = true;

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

        if (message.referencedMessage.systemContent) {
          const systemContent = message.referencedMessage.systemContent;
          delete message.referencedMessage.systemContent;
          if (!replyMessage.content) {
            replyMessage.content = [
              {
                content: [
                  {
                    content: systemContent,
                    type: "text",
                  },
                ],
                type: "em",
              },
            ];
          }

          if (replyMessage.attachments?.length > 0) {
            // using .push triggers some caching thing and the emoji duplicates
            // every channel load
            replyMessage.content = [
              ...replyMessage.content,
              {content: " ", type: "text"},
              MarkupUtils.parseToAST("\u{1f5bc}")[0],
            ];
          } else if (replyMessage.stickers?.length > 0) {
            replyMessage.content = [
              ...replyMessage.content,
              {content: " ", type: "text"},
              MarkupUtils.parseToAST("\u2728")[0],
            ];
          } else if (replyMessage.embeds?.length > 0) {
            replyMessage.content = [
              ...replyMessage.content,
              {content: " ", type: "text"},
              MarkupUtils.parseToAST("\u{1f5d2}")[0],
            ];
          }
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
