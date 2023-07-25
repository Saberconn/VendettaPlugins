import {registerCommand} from "@vendetta/commands";
import {storage} from "@vendetta/plugin";
import {settings} from "@vendetta";
import {connectToDebugger} from "@vendetta/debug";

// FIXME: remove when upstream fixes types not getting exported
enum ApplicationCommandInputType {
  BUILT_IN,
  BUILT_IN_TEXT,
  BUILT_IN_INTEGRATION,
  BOT,
  PLACEHOLDER,
}

enum ApplicationCommandType {
  CHAT = 1,
  USER,
  MESSAGE,
}

let removeCommand: Function;

export const onLoad = () => {
  if (storage.autostart) {
    connectToDebugger(settings.debuggerUrl);
  }
  removeCommand = registerCommand({
    name: "debugger",
    displayName: "debugger",
    description: "Start debugger",
    displayDescription: "Start debugger",
    type: ApplicationCommandType.CHAT as number,
    inputType: ApplicationCommandInputType.BUILT_IN as number,
    applicationId: "-1",
    options: [],
    execute: () => {
      connectToDebugger(settings.debuggerUrl);
    },
  });
};

export const onUnload = () => {
  removeCommand?.();
};

export {default as settings} from "./settings";
