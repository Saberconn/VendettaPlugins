import {before} from "@vendetta/patcher";
import {ReactNative} from "@vendetta/metro/common";

const {DCDChatManager} = ReactNative.NativeModules;

const unpatch = before("updateRows", DCDChatManager, (args) => {
  const rows = JSON.parse(args[1]);

  for (const row of rows) {
    if (row.type !== 1 || !row?.message?.embeds || !row?.message?.content)
      continue;

    let imageCount = 0;
    const urls = [];
    for (const embed of row.message.embeds) {
      if (embed.type == "image" || embed.type == "gifv") {
        imageCount++;
        urls.push(embed.url);
      }
    }

    const linkContent = [];
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      linkContent.push({
        type: "link",
        content: [
          {
            type: "text",
            content: url,
          },
        ],
        target: url,
      });
      if (i < urls.length - 1) {
        linkContent.push({
          type: "text",
          content: "\n",
        });
      }
    }

    if (row.message.content.length == 0 && imageCount > 0) {
      row.message.content.push(...linkContent);
    }
  }

  args[1] = JSON.stringify(rows);
});

export const onUnload = () => {
  unpatch();
};
