import { coord1, coord2 } from "./types"; 

function getDistanceMeters(coord1: coord1, coord2: coord2): number {
   const { lat1, lon1 } = coord1;
   const { lat2, lon2 } = coord2;

   const R = 6371e3; // Earth's radius in meters

   // Convert latitude and longitude from degrees to radians
   const lat1Rad = (lat1 * Math.PI) / 180;
   const lat2Rad = (lat2 * Math.PI) / 180;
   const deltaLatRad = ((lat2 - lat1) * Math.PI) / 180;
   const deltaLonRad = ((lon2 - lon1) * Math.PI) / 180;
 
   // Haversine formula
   const a =
     Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
     Math.cos(lat1Rad) * Math.cos(lat2Rad) *
     Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);
   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
 
   const distance = R * c; // Distance in meters

   return distance;
}

function getDistanceKm(coord1: coord1, coord2: coord2): number {
   return getDistanceMeters(coord1, coord2) / 1000;
}


function busId(bus: string): string {
   const id = 'xyxyxyxy'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
 
    return bus + "_" + id
  }

  
export {
   getDistanceKm,
   getDistanceMeters,
   busId
}