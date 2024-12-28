import { supported } from "./types"; 
import * as logger from "../logger";
import { BaseBus } from "./BaseBus";
import { RouteMaps } from "./GenericRoute";

const logging = logger.wichFileToLog("BusInstance");

/**
 * setInstance for subclasses currently for Dasutransco
 * Singleton to only set once and having a persistent data for registering user shared location
 * subclass are registered in buses object
 */
export class BusInstance {
   static instance: any = null;
   private buses: { [key: string]: any } = {};

   constructor() {
      if (BusInstance.instance) {
         return BusInstance.instance;
      }
   }

   register(config: any) {
      if (!BusInstance.instance) {

         if (!config.allowedBus || typeof(config.allowedBus) !== "object") {
            logging.error("No allowedBus found, please register on default settings yaml. ['BUSNAME']")
            process.exit(1);
         }

         for (let allowedBus of config.allowedBus) {
            try { 
               const ctx = new BaseBus();
               const routes = RouteMaps[allowedBus as supported];
               
               if (routes) {
                  ctx.setConfig(allowedBus, routes, config);
                  this.buses[allowedBus] = ctx;
               } else {
                  logging.warn(`Inable to register ${allowedBus} where route from map is ${routes} "RouteMaps[allowedBus as supported]"`)
               }

            }
            catch (error) {
               logging
               .error( 
                  "Failed to register bus", 
                  `${allowedBus}`, 
                  "\n", error
               )
               process.exit(1);
            }
         }

         BusInstance.instance = this; 
      } else {
         logging.warn("Bus is already registered");
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