import { supported, literals } from "./types"; 
import { Dasutransco } from "./Dasutransco";
import * as logger from "../logger";

const logging = logger.wichFileToLog("BusInstance");

export class BusInstance {
   config: any = null
   singleton = false;
   buses: { [key: string]: any } = {};

   dasutransco = new Dasutransco();

   constructor(config: any) {
      this.config = config
   }

   setInstance() {
      if (!this.singleton) {

         const instances: literals = {
            DASUTRANSCO: this.dasutransco
         }

         for ( let [key, ctx] of Object.entries(instances)) {
            try { 
               ctx.setConfig(this.config);
               this.buses[key] = ctx 
            } 
            catch (error) {
               logging
               .error( 
                  "Failed to set Bus Instance", 
                  `${key} => ${ctx}`, 
                  "\n", error
               )
               process.exit(1);
            }
         }

         this.singleton = true;
      }
   }  

   getBusType(name: string) {
      const userBus =  this.buses[name];
      if (!userBus) return null;
      return userBus; 
   }

   cleanUpAge() {
      for (let bus in this.buses) {
         this.buses[bus].cleanUpAge();
      }
   }

   forceCleanUp() {
      for (let bus in this.buses) {
         this.buses[bus].forceCleanUp();
      }
   }
}