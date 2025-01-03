//default.settings.yaml => allowedBus
export type dasutransco = "DASUTRANSCO";
export type mintransco = "MINTRANSCO"
export type dipatransco = "DIPATRANSCO"

export type supported = dasutransco | mintransco | dipatransco;

export type supportedBuses = { [key in supported]: any };

export type coord1 = {
   lat1: number,
   lon1: number
}

export type coord2 = {
   lat2: number,
   lon2: number
}