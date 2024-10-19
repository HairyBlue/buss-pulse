// import types
import * as types from "./types"

// lib
import Fastify, { DoneFuncWithErrOrRes, FastifyInstance, FastifyReply, FastifyRequest, RouteOptions } from "fastify";
import { WebSocket, WebSocketServer } from "ws";
import * as cron from "node-cron";

// locals
import { configs } from "./config"
import { BusInstance } from "./bus/BusInstance";
import { getDistanceFromBCenter } from "./bus/util"; 
import * as logger from "./logger";

import * as user from "./routes/users"
interface ExtendWebSocket extends WebSocket {
   lastActive?: number
}

const logging = logger.wichFileToLog("app");
const defaultConfig = configs.default.settings;

if (!defaultConfig) {
   logging.error("No defualt config", defaultConfig,  " => ", configs);
   process.exit(1);
}

// FASTIFY
const fastify = Fastify();

//Websocket
let wss: WebSocketServer; 

//Instance
const userBus = new BusInstance(defaultConfig);
userBus.setInstance();

let cleanUpIntervalAges: any = null;

// BOUNDARY ###########################################################################################

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

// CLOSE CONNECTION
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

// CLOSE CONNECTION
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