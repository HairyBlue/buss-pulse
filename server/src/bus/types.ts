export type dasutransco = "DASUTRANSCO";

export type supported = dasutransco;

export type literals = { [key in supported]: any };

export type coord1 = {
   lat1: number,
   lon1: number
}

export type coord2 = {
   lat2: number,
   lon2: number
}