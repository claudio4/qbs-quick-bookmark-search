import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json";

export default defineManifest({
  manifest_version: 3,
  name: "QBS - Quick Bookmark Search",
  short_name: "QBS",
  version: pkg.version,
  description: pkg.description,
  permissions: ["bookmarks", "favicon", "activeTab", "scripting", "userScripts"],
  icons: {
    16: "public/qbk-16.png",
    48: "public/qbk-48.png",
    128: "public/qbk-128.png",
  },
  action: {
    default_icon: {
      16: "public/qbk-16.png",
      48: "public/qbk-48.png",
      128: "public/qbk-128.png",
    },
    default_title: "QBS",
    default_popup: "src/popup/index.html",
  },
  commands: {
    _execute_action: {
      suggested_key: {
        default: "Alt+G",
      },
      description: "Open QBS",
    },
  },
});
