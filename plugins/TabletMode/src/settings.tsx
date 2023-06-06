import {storage} from "@vendetta/plugin";
import {useProxy} from "@vendetta/storage";
import {Forms, General} from "@vendetta/ui/components";
import {findByProps} from "@vendetta/metro";

const DeviceInfo = findByProps("isTablet");

const {ScrollView} = General;
const {FormSwitchRow} = Forms;

export default function TabletModeSettings() {
  useProxy(storage);

  return (
    <ScrollView style={{flex: 1}}>
      <FormSwitchRow
        label="Use Tablet Mode"
        value={storage.tabletMode ?? DeviceInfo.isTablet}
        onValueChange={(value: boolean) => {
          storage.tabletMode = value;
          DeviceInfo.getConstants();
        }}
      />
    </ScrollView>
  );
}
