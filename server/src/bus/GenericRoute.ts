import lodash from "lodash";
import { supported } from "./types"

const RouteMaps: {[key in supported]: any} = {
   DASUTRANSCO: {
      "tacul_matanao_hagonoy_digos": "Tacul Magsaysay via Hagonoy & Matanao - Digos City",
      "digos_hagonoy_matano_tacul": "Digos City - Tacul Magsaysay via Hagonoy & Matanao"
   },
   MINTRANSCO: {},
   DIPATRANSCO: {}
}


export {
   RouteMaps
}