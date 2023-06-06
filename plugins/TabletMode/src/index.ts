import {after} from "@vendetta/patcher";
import {findByProps} from "@vendetta/metro";
import {storage} from "@vendetta/plugin";
import TabletModeSettings from "./settings";

const DeviceInfo = findByProps("isTablet");

const unpatch = after("getConstants", DeviceInfo, (args, ret) => {
  ret.isTablet = storage.tabletMode ?? DeviceInfo.isTablet;
});
DeviceInfo.getConstants();

export default {
  onUnload: () => {
    unpatch();
    DeviceInfo.getConstants();
  },
  settings: TabletModeSettings,
};
