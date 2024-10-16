export type coord = {
   lat: number,
   lon: number
}

export type UserBus = {
   uuid: string,
   name: string,
   route: string,
   coord: string,
   time?: number, // Date.now()
}