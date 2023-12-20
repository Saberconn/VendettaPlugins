import {after, instead} from "@vendetta/patcher";
import {findByName, findByProps, findByStoreName} from "@vendetta/metro";
import {ReactNative} from "@vendetta/metro/common";
import {findInReactTree} from "@vendetta/utils";

const Flux = findByProps("useStateFromStores");

const ChatInputNew = findByProps("Actions", "ExpressionButton");
const Avatar = findByProps("getStatusSize").default;
const {Pressable} = ReactNative;
const {DEFAULT_STATUS_CUTOUT} = findByProps("DEFAULT_STATUS_CUTOUT");

const SelfPresenceStore = findByStoreName("SelfPresenceStore");
const UserStore = findByStoreName("UserStore");
const SelectedChannelStore = findByStoreName("SelectedChannelStore");
const ChannelStore = findByStoreName("ChannelStore");

const showUserProfileActionSheet = findByName("showUserProfileActionSheet");
const ActionSheet = findByProps("openLazy", "hideActionSheet");
const StatusPickerActionSheet = findByName("StatusPickerActionSheet");
const Settings = findByProps("saveAccountChanges");
const {UserSettingsSections} = findByProps("UserSettingsSections");

function AvatarAction() {
  const self = Flux.useStateFromStores([UserStore], () =>
    UserStore.getCurrentUser()
  );
  const status = Flux.useStateFromStores([SelfPresenceStore], () =>
    SelfPresenceStore.getStatus()
  );
  const channel = Flux.useStateFromStores(
    [ChannelStore, SelectedChannelStore],
    () =>
      ChannelStore.getChannel(
        SelectedChannelStore.getCurrentlySelectedChannelId()
      )
  );

  return (
    <Pressable
      style={{
        height: 40,
        width: 40,
        marginHorizontal: 4,
        flexShrink: 0,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
      }}
      onLongPress={openStatus}
      onPress={createOpenProfile(self.id, channel.id)}
    >
      <Avatar
        user={self}
        guildId={channel.guild_id}
        status={status}
        avatarDecoration={self.avatarDecoration}
        animate={true} // configurable?
        autoStatusCutout={DEFAULT_STATUS_CUTOUT}
      />
    </Pressable>
  );
}

function createOpenProfile(userId, channelId) {
  return () => {
    showUserProfileActionSheet({
      userId,
      channelId,
    });
  };
}

function openStatus() {
  ActionSheet.hideActionSheet();
  ActionSheet.openLazy(
    async function () {
      return StatusPickerActionSheet;
    },
    "StatusPicker",
    {
      onSetCustomStatus: function () {
        ActionSheet.hideActionSheet();
        Settings.open(UserSettingsSections.CUSTOM_STATUS, null, {
          openWithoutBackstack: true,
        });
      },
    }
  );
}

const patches = [];

export const onLoad = () => {
  // add button
  patches.push(
    after("render", ChatInputNew.default, (args, ret) => {
      const insertPoint = findInReactTree(
        ret,
        (x) => x?.children?.[0]?.props?.actions
      ).children;

      insertPoint.splice(0, 0, <AvatarAction />);
    })
  );
};

export const onUnload = () => {
  for (const unpatch of patches) {
    unpatch?.();
  }
};
