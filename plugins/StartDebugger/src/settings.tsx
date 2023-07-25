import {storage} from "@vendetta/plugin";
import {useProxy} from "@vendetta/storage";
import {Forms, General} from "@vendetta/ui/components";

const {ScrollView} = General;
const {FormSwitchRow} = Forms;

export default function StartDebuggerSettings() {
  useProxy(storage);

  return (
    <ScrollView style={{flex: 1}}>
      <FormSwitchRow
        label="Autostart debugger"
        value={storage.autostart ?? false}
        onValueChange={(value: boolean) => {
          storage.autostart = value;
        }}
      />
    </ScrollView>
  );
}
