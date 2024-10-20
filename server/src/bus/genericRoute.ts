import lodash from "lodash";
import { supportedBuses } from "./types"
import * as Dasutransco from "./Dasutransco";

const allRoutes: supportedBuses = {
   DASUTRANSCO: Dasutransco.standardizeRoute,
   MINITRANSCO: {},
   DIPATRANSCO: {}
}


export {
   allRoutes
}