import * as yaml from "js-yaml";
import * as path from "path";
import * as fs from "fs";

const settingsPath = path.join(__dirname, "settings");
const settings = fs.readdirSync(settingsPath)

let configs: { [key: string]: any }  = {};

for (let setting of settings) {
   if (setting.endsWith(".yaml")) {
      const filePath = `${settingsPath}/${setting}`;
      const content  =  yaml.load(fs.readFileSync(filePath, "utf-8")) as any;
      const settings = content.settings;
      
      if (settings) {
         const splitFileName = setting.split(".");
         const configType = splitFileName[0];

         configs[configType] = content;
      }
      
   }
} 


export { configs };