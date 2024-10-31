import lodash from "lodash";
import { supportedBuses } from "./types"
import * as Dasutransco from "./buses/Dasutransco";

const allRoutes: supportedBuses = {
   DASUTRANSCO: Dasutransco.standardizeRoute,
   MINTRANSCO: {},
   DIPATRANSCO: {}
}


export {
   allRoutes
}