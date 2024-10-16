import { UserBus, coord } from "../types";
import { dasutransco } from "./types"; 
import { getDistanceMeters, busId } from "./util"; 

import * as logger from "../logger";

const logging = logger.wichFileToLog("Dasutransco");
const mybuss = "DASUTRANSCO";

export const standardizeRoute: { [key: string]: string} = {
   "tacul_matanao_hagonoy_digos": "Tacul Magsaysay via Hagonoy & Matanao - Digos City",
   "digos_hagonoy_matano_tacul": "Digos City - Tacul Magsaysay via Hagonoy & Matanao"
}

type user = {
      name: string,
      time: number
   } & coord

type userReg = { [key: string]: user }

type route = { [key: string]: userReg }

type busReg = { [key: string]: userReg }
type group = { [key: string]: busReg }

export class Dasutransco {
   routes: route = {}
   groups: group = {}
   ageRoute: {[key: string]: number} = {}

   register(msg: UserBus) {
      if (!msg) return

      const coord = /([-]?\d+\.\d+), *([-]?\d+\.\d+)/.exec(msg.coord);

      if (msg.name !== ("DASUTRANSCO" as dasutransco)) {
         logging.warn("Unable to register user, not match name", msg.name);
         return
      }

      if (!coord) {
         logging.warn("Unable to register user, not match coord", msg.coord);
         return
      }

      if (! standardizeRoute[msg.route]) {
         logging.warn("Unable to register user, not match standardizeRoute", msg.route);
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
         lat: lat,
         lon: lon
      }

      this.routes[msg.route][msg.uuid] = regUser;
      this.ageRoute[msg.route] = Date.now();

      this.groupUserInMeters(regUser, msg)
   }

   schedCleanUp() {

   }

   cleanUpAge() {
      const userThreshold  = 3 * 60 * 1000;
      const routeThreshold  = 5 * 30 * 1000;
      const currentTime = Date.now();

      for (let ageroute in this.ageRoute) {
         if (currentTime - this.ageRoute[ageroute] > routeThreshold) {
            delete this.routes[ageroute];
            delete this.groups[ageroute];
            delete this.ageRoute[ageroute];
         }
      }

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
   }


   groupUserInMeters(regUser: user, msg: UserBus) {
      const threshold = 8.0;
      const minTrack = 1;

      let alreadyInGroup: boolean = false;

      if (!this.groups[msg.route]) {
         this.groups[msg.route] = {};
      }
      
      for (let groute in this.groups) {
         const busIds = this.groups[groute];
         
         for (let busId in busIds) {
            let nearUsersCount = 0;

            if (this.groups[groute][busId][msg.uuid]) {
               this.groups[groute][busId][msg.uuid] = regUser;
               
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
                  delete this.groups[groute][busId][msg.uuid];
                  alreadyInGroup = false;
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
               nearUsers.push(msg.uuid);
               const bId = busId(mybuss);

               if (!this.groups[msg.route][bId]) {
                  this.groups[msg.route][bId] = {}
               }

               for (let nearUser of nearUsers) {
                  this.groups[msg.route][bId][nearUser] = userRoute[nearUser];
               }
   
            }
         }
      }


      
   }
   
}