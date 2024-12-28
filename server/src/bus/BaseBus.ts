import { UserBus, coord } from "../types";
import { getDistanceMeters, busId } from "./util"; 

import * as logger from "../logger";

const logging = logger.wichFileToLog("BaseBus");

type user = {
      name: string,
      time: number,
      removeLaterAt: number | null
   } & coord

type userReg = { [key: string]: user }

type route = { [key: string]: userReg }

type busReg = { [key: string]: userReg }
type group = { [key: string]: busReg }

// How did the past me did this
// Help me past me to understand this
export class BaseBus {
   private name: string = "NOT_ALLOWED";
   private sroute: {[key: string]: any} = {}
   private config: any = null;

   private routes: route = {};
   private groups: group = {};
   private ageRoute: {[key: string]: number} = {}

   setConfig(name: string, standardizeRoute: any, config: any) {
      this.name = name;
      this.sroute = standardizeRoute;
      this.config = config
   }

   standardizeRoute(sroute: string): boolean {
      if (this.sroute[sroute]) return true
      return false
   }

   register(msg: UserBus) {
      if (!msg) return

      const coord = /([-]?\d+\.\d+), *([-]?\d+\.\d+)/.exec(msg.coord);

      if (msg.name !== this.name) {
         logging.warn("Unable to register user, not match name", msg.name);
         return
      }

      if (!coord) {
         logging.warn("Unable to register user, not match coord", msg.name, msg.coord);
         return
      }

      if (!this.sroute[msg.route]) {
         logging.warn("Unable to register user, not match standardize route", msg.name, msg.route);
         return
      }

      if (!this.routes[msg.route]) {
         this.routes[msg.route] = {};
      }

      const lat = parseFloat(coord[1]);
      const lon = parseFloat(coord[2]);

      const regUser: user = {
         name: msg.name, 
         time: msg.time,
         removeLaterAt: msg.removeLaterAt as any, // from user this always null. but will used if no user nearby groups
         lat: lat,
         lon: lon
      }

      this.routes[msg.route][msg.uuid] = regUser;
      this.ageRoute[msg.route] = Date.now();

      this.groupUserInMeters(regUser, msg)
   }

   forceCleanUp() {
      this.routes = {};
      this.groups = {};
      this.ageRoute = {};

      logging.info("Force clean up done");
   }

   cleanUpAge() {
      const userThreshold  = this.config.cleanUp.userThreshold; //15 * 60 * 1000 15min
      const routeThreshold  = this.config.cleanUp.routeThreshold; //30 * 60 * 1000 30min
      const currentTime = Date.now();

      // This will remove staled routes, usually a route that no active users currently
      for (let ageroute in this.ageRoute) {
         if (currentTime - this.ageRoute[ageroute] > routeThreshold) {
            delete this.routes[ageroute];
            delete this.groups[ageroute];
            delete this.ageRoute[ageroute];
         }
      }

      // This will remove staled users in routes and particular routes buses
      for (let route in this.routes) {
         const userRoute = this.routes[route];
         for (let user in userRoute) {
            const meUser = userRoute[user];
            if (meUser) {
               if (currentTime - meUser.time > userThreshold) {
                  delete this.routes[route][user]
                  
                  const busIds = this.groups[route];
                  for (let busId in busIds) {
                     if (this.groups[route][busId]) {
                        if (this.groups[route][busId][user]) {
                           delete this.groups[route][busId][user]
                        }
                     }
                  }
               }
            }
         }
      }

      // When User is staled, user will remove on routes and particular routes buses.
      // We dont want to see BusIds in the client with no active user
      // If BusId have no user or no lenght, we will remove it
      for (let groute in this.groups) {
         for (let bid in this.groups[groute]) {
            // check if possible bus has user. else remove
            const uuids = Object.keys(this.groups[groute][bid]);

            if (uuids.length <= 0) {
               delete this.groups[groute][bid];
            }
         }
      }
   }

   // This will group user currently in the routes, if has nearby users
   // first this check in the groups obj, if user already exist then update the current info and Coords
   // secondly this check a nearby user, if no nearby user, removeLaterAt will intialize a Date ms. then remove if > threshold
   groupUserInMeters(regUser: user, msg: UserBus) {
      const threshold = this.config.distance.meters.threshold; //8.0;
      const minTrack = this.config.distance.meters.minNearUser; //1;

      let alreadyInGroup: boolean = false;

      if (!this.groups[msg.route]) {
         this.groups[msg.route] = {};
      }
      
      for (let groute in this.groups) {
        for (let busId in  this.groups[groute]) {
            
            // This probably a new user enable the shared coordinates that has not been in groups
            if (!this.groups[groute][busId][msg.uuid]) {
               let nearUsersCount = 0;
               const newReg = Object.assign({}, regUser);

               // check if there is already users in this BusId
               if (Object.keys(this.groups[groute][busId]).length > 0) {
                  for (let users in this.groups[groute][busId]) {

                     const meUser = this.routes[groute][msg.uuid];
                     const otherUser = this.groups[groute][busId][users];
         
                     if (meUser && otherUser) {
                        const distance = getDistanceMeters( 
                           {
                              lat1: meUser.lat, 
                              lon1: meUser.lon
                           },
                           {
                              lat2: otherUser.lat, 
                              lon2: otherUser.lon
                           }
                        )
                        
                        if (distance < threshold) {
                           nearUsersCount++;
                        }
                        
                     }
                  }
               }

               if (nearUsersCount > 0) {
                  this.groups[groute][busId][msg.uuid] = newReg;
                  alreadyInGroup = true;
               }
            } 


            else if (this.groups[groute][busId][msg.uuid]) {

               let nearUsersCount = 0;
               const newReg = Object.assign({}, regUser);

               const meRemoveLater = this.groups[groute][busId][msg.uuid].removeLaterAt;
               
               if (typeof(meRemoveLater) == "number") {
                  newReg.removeLaterAt = meRemoveLater;
               } 
               
               // This will update there info, including the coords
               this.groups[groute][busId][msg.uuid] = newReg;

               for (let users in this.groups[groute][busId]) {
                  if (users == msg.uuid) {
                     continue
                  }

                  const meUser = this.groups[groute][busId][msg.uuid];
                  const otherUser = this.groups[groute][busId][users];
      
                  if (meUser && otherUser) {
                     const distance = getDistanceMeters( 
                        {
                           lat1: meUser.lat, 
                           lon1: meUser.lon
                        },
                        {
                           lat2: otherUser.lat, 
                           lon2: otherUser.lon
                        }
                     )

                     if (distance < threshold) {
                        nearUsersCount++;
                     }
                     
                  }
               }
              
               if (nearUsersCount == 0) {
                  const hasToRemove = this.groups[groute][busId][msg.uuid].removeLaterAt;
                 
                  if (hasToRemove == null || isNaN(hasToRemove)) {
                     this.groups[groute][busId][msg.uuid].removeLaterAt = Date.now();
                  } 

                  else if (Date.now() - hasToRemove > this.config.removeLaterAt) {
                     delete this.groups[groute][busId][msg.uuid];
                     alreadyInGroup = false;
                  }
               } else {
                  this.groups[groute][busId][msg.uuid].removeLaterAt = null;
               }

               alreadyInGroup = true;
               continue
            }
         }
      }

      if (!alreadyInGroup) {
        
         for (let route in this.routes) {
            const userRoute = this.routes[route];
            
            const nearUsers = [];
   
            for (let uuid in userRoute) {
               if (msg.uuid == uuid) {
                  continue
               }
   
               const meUser = userRoute[msg.uuid];
               const otherUser = userRoute[uuid];
   
               if (meUser && otherUser) {
                  const distance = getDistanceMeters( 
                     {
                        lat1: meUser.lat, 
                        lon1: meUser.lon
                     },
                     {
                        lat2: otherUser.lat, 
                        lon2: otherUser.lon
                     }
                  )
                  
                  if (distance < threshold) {
                     nearUsers.push(uuid);
                  }
                  
               }
            }
            
            
            if (nearUsers.length >= minTrack) {
               const bId = busId(this.name);

               if (!this.groups[msg.route][bId]) {
                  this.groups[msg.route][bId] = {}
               }

               for (let nearUser of [msg.uuid, ...nearUsers]) {
                  this.groups[msg.route][bId][nearUser] = userRoute[nearUser];
               }
   
            }
         }
      }

   }

   getAvailableBus(route: string) {
      return this.groups[route] ? this.groups[route] : {}
   }

   getSelectedBus(route: string, busId: string) {
      return this.groups[route][busId] ? this.groups[route][busId] : {}
   }
}