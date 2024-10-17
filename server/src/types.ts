export type coord = {
   lat: number,
   lon: number
}

export type UserBus = {
   country: string
   uuid: string,
   name: string,
   route: string,
   coord: string,
   time: number, // Date.now()
   removeLaterAt: number // Date.now() + 10 * 60 * 1000
}