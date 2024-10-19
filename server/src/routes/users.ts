import Fastify, { FastifyReply, FastifyRequest, FastifyInstance } from "fastify";
import { BusInstance } from "../bus/BusInstance";


function buildRoutes(fastify: FastifyInstance, opts: any, done: any) {
   fastify.get("/:bus/:route", function(request: FastifyRequest, reply: FastifyReply) {
      const { prefix, userBus } = opts;
      const { bus, route } = request.params as any;

      const myBuss = userBus.getBusType(bus);

      if (!myBuss && !myBuss.standardizeRoute) {
         reply.code(400);
         return
      }

      reply.code(200).send({
         data: myBuss.getBusesBaseRoute(route)
      })
   })


   done();
}

export {
   buildRoutes
}
