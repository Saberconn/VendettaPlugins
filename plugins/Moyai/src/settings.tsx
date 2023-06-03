import {storage} from "@vendetta/plugin";
import {useProxy} from "@vendetta/storage";
import {Forms, General} from "@vendetta/ui/components";

const {ScrollView} = General;
const {FormSwitchRow} = Forms;

export default function MoyaiSettings() {
  useProxy(storage);

  return (
    <ScrollView style={{flex: 1}}>
      <FormSwitchRow
        label="Play on reactions"
        value={storage.allowReactions ?? true}
        onValueChange={(value: boolean) => {
          storage.allowReactions = value;
        }}
      />
    </ScrollView>
  );
}
