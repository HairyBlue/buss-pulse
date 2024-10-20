import Fastify, { FastifyReply, FastifyRequest, FastifyInstance } from "fastify";
import * as genericRoute from "../bus/genericRoute";


function buildRoutes(fastify: FastifyInstance, opts: any, done: any) {
   fastify.get("/bus-and-route", function(request: FastifyRequest, reply: FastifyReply) {
      reply.code(200).send({
         data: genericRoute
      })
   })

   fastify.get("/:bus/:route", function(request: FastifyRequest, reply: FastifyReply) {
      const { prefix, userBus } = opts;
      const { bus, route } = request.params as any;

      const myBuss = userBus.getBusType(bus);
      
      if (!myBuss || !myBuss.standardizeRoute[route]) {
         reply.code(400).send({ok: false});
         return
      }

      reply.code(200).send({
         ok: true,
         data: myBuss.getBusesBaseRoute(route)
      })
   })


   done();
}

export {
   buildRoutes
}
