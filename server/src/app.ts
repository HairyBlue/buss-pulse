// import types
import * as types from "./types"

// lib
import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import { WebSocket, WebSocketServer } from "ws";

// locals
import { BusInstance } from "./bus/BusInstance";
import * as logger from "./logger";

const logging = logger.wichFileToLog("app");

const userBus = new BusInstance();
userBus.setInstance();

const fastify = Fastify({
   // logger: true
})

fastify.get("/", function(request: FastifyRequest, reply: FastifyReply) {
   const myBuss = userBus.getBusType("DASUTRANSCO");

   reply.code(200).send(
      {
         message: { 
            routes: myBuss.routes, 
            groups: myBuss.groups
         }
      }
   )
})

const wss = new WebSocketServer({ 
   path: "/connect",
   server: fastify.server
})


wss.on("connection", (ws: WebSocket) => {
   ws.on("message", (message: string) => {
      const msg = JSON.parse(message) as types.UserBus;
      const myBuss = userBus.getBusType(msg.name);

      if (myBuss) {
         msg.time = Date.now();
         myBuss.register(msg);
      }

   })
})

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


userBus.cleanUpInterval()
