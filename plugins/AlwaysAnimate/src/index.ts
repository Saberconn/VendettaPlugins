import {before, after} from "@vendetta/patcher";
import {findByName, findByProps} from "@vendetta/metro";
import {findInReactTree} from "@vendetta/utils";

const GuildIcon = findByName("GuildIcon");
const Avatar = findByProps("getStatusSize");
const DisplayBanner = findByName("DisplayBanner", false);

const patches: Function[] = [];

export const onLoad = () => {
  // Guild Icons
  patches.push(
    before("render", GuildIcon.prototype, function () {
      this.props.animate = true;
    })
  );

  // Avatars (not used by chat)
  patches.push(
    before("type", Avatar.default, function ([props]) {
      props.animate = true;
    })
  );

  // Profile Banners (bypasses GIF playback option)
  patches.push(
    after("default", DisplayBanner, function (args, ret) {
      const ClickWrapperProps = findInReactTree(
        ret,
        (x) => x.accessibilityRole == "image" && x.onPress != null
      );
      const Banner = findInReactTree(
        ClickWrapperProps,
        (x) => x.type?.name == "ProfileBanner"
      );
      if (
        Banner &&
        Banner.key.endsWith("-false") &&
        Banner.props.bannerSource?.uri?.indexOf("/a_") > -1
      ) {
        ClickWrapperProps.onPress();
      }
    })
  );
};

export const onUnload = () => {
  for (const unpatch of patches) {
    unpatch?.();
  }
};
