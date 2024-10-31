// import types
import * as types from "./types"

// lib
import Fastify, { FastifyInstance } from "fastify";
import { WebSocket, WebSocketServer } from "ws";
import * as cron from "node-cron";

// locals
import { configs } from "./config"
import { BusInstance } from "./manage-bus/BusInstance";
import { getDistanceFromBCenter } from "./manage-bus/util"; 
import * as logger from "./logger";

import * as user from "./fastify-routes/users";
interface ExtendWebSocket extends WebSocket {
   lastActive?: number
}

const logging = logger.wichFileToLog("app");

/**
 * This config can be found on settings/*.yaml
 * It provide a global setting were many functions are using the same
 * This also easy to modify if the any adjustment
 * you can edit which suite your need
 */
const defaultConfig = configs.default.settings;
if (!defaultConfig) {
   logging.error("No defualt config", defaultConfig,  " => ", configs);
   process.exit(1);
}

// FASTIFY
const fastify = Fastify();

//Websocket
let wss: WebSocketServer; 

/**
 * BusIntance
 * 
 * Only instantiate once, do not declare new intance of it since there is a persistent data from the subclass
 * Subclasess (are the Bus Cooperative in my area)
 *    Dasutransco
 */
const userBus = new BusInstance(defaultConfig);
userBus.setInstance();

let cleanUpIntervalAges: any = null;

// BOUNDARY ###########################################################################################

/**
 * Rest should be scope or prefix with /api
 * (fastify, opt, done) 
 * fastify = FastifyInstance
 * opt = { prefix: "/api", userBus: userBus}. this inject to user.buildRoutes
 *       no need to pass value in function
 */
fastify.register((fastify, opt, done)=>{ user.buildRoutes(fastify, opt, done)}, { prefix: "/api", userBus: userBus})


function terminateAllClientConnection() {
   let connectedUser = 0;
   wss.clients.forEach((client) => {
      client.terminate();
      connectedUser++;
   })

   logging.info(`Terminated  all connection. ${connectedUser} user remove`)
}

function terminateClientTimeOut() {
   const current = Date.now();

   wss.clients.forEach((client: any) => {
      if (
         !client.lastActive || 
         current - client.lastActive > defaultConfig.timeout
         ) 
         {
            client.terminate();
         }
   })
}

function cleanUpAges() {
   if (!cleanUpIntervalAges) {
      cleanUpIntervalAges = setInterval(() => {
         terminateClientTimeOut();
         userBus.cleanUpAge();
      }, defaultConfig.cleanUp.interval)
   }
}


function startWebSocket() {
   wss = new WebSocketServer({ 
      path: "/connect",
      server: fastify.server
   });

   wss.on("connection", (ws: ExtendWebSocket) => {
      ws.lastActive = Date.now();

      ws.on("message", (message: string) => {
         const msg = JSON.parse(message) as types.UserBus;
         const myBuss = userBus.getBusType(msg.name);
   
         if (myBuss) {
            const distance = getDistanceFromBCenter(msg.coord, defaultConfig.centerCoord);

            if (
               msg.country == defaultConfig.allowedCountry &&
               distance < defaultConfig.allowedDistance
            ) {
               msg.time = Date.now();
               myBuss.register(msg);
            }
         }
      })
   });

   cleanUpAges();
}

// CRON CONFIG
const schedule = defaultConfig.schedule;

// CLOSE CONNECTION at 10 pm Asia/Manila timezone
cron.schedule(schedule.closedConnection.cron, function() {
   logging.info('Stopping WebSocket server at 10 PM.');
   terminateAllClientConnection();
   userBus.forceCleanUp();

   wss.close();

   setTimeout(() => {
      wss.on("close", ()=> {
         if (cleanUpIntervalAges) {
            clearInterval(cleanUpIntervalAges)
         }
      
         cleanUpIntervalAges = null;
      });
   }, 3000) 

}, {
   scheduled: schedule.closedConnection.enable,
   timezone: schedule.closedConnection.timezone
});

// OPENING CONNECTION at 5 am Asia/Manila timezone
cron.schedule(schedule.openConnection.cron, function() {
   setTimeout(() => {
      logging.info('Booting WebSocket server at 5 AM.');
      startWebSocket();
   }, 3000)
}, {
   scheduled: schedule.openConnection.enable,
   timezone: schedule.openConnection.timezone
});


function initializeConnection() {
   logging.info('Initializing WebSocket server on boot.');
   startWebSocket();
}

initializeConnection();

process
   .on('uncaughtException', err => {
      logging.error(`Uncaught Exception: ${err.message}`)
   })
   .on('unhandledRejection', (reason, promise) => {
      logging.error('Unhandled rejection at ', promise, `reason: ${reason}`)
      // process.exit(1)
   })


fastify.listen({ host: "0.0.0.0", port: 3510  }, function (err, address) {
   if (err) {
      logging.error(err);
      process.exit(1);
   }
   // Server is now listening on ${address}
   logging.info(`Server is now listening on ${address}`)
 })