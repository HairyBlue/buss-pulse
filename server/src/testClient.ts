import { UserBus } from "./types";
import { WebSocket } from 'ws';

let webSocket: WebSocket | null = null;
let reconnectInterval: any = null; // Time between reconnection attempts (3 seconds)
let reconnectTimeout = 3000;

const standardizeRoute: {[key: string]:string} = {
   "Tacul Magsaysay via Hagonoy & Matanao - Digos City": "tacul_matanao_hagonoy_digos",
   "Digos City - Tacul Magsaysay via Hagonoy & Matanao": "digos_hagonoy_matano_tacul"
}

const sampleData: UserBus[] = [
   {
      country: "PH",
      uuid: "f6962f40-1edf-4691-8d03-2cbe494058f3",
      name: "DASUTRANSCO",
      route: "digos_hagonoy_matano_tacul", // Standardized route
      coord: "6.684264, 125.296081",  // Poblacion Hagonoy coordinates
      time: Date.now() - (5 * 60 * 1000), // Current time + 3 minutes
      removeLaterAt: NaN
   },
   {
      country: "PH",
      uuid: "9dccb786-684c-44f8-bbdf-9a8531878db8",
      name: "DASUTRANSCO",
      route: "tacul_matanao_hagonoy_digos", // Standardized route
      coord: "6.684264, 125.296103",  // Near Poblacion Hagonoy
      time: Date.now() - (10 * 1000), // Current time + 1 minute,
      removeLaterAt: NaN
   },
   {
      country: "PH",
      uuid: "b8462571-abc1-4417-8ea7-cdde0b91d7ab",
      name: "DASUTRANSCO",
      route: "digos_hagonoy_matano_tacul", // Standardized route
      coord: "6.684176, 125.296036",  // Nearby Poblacion Hagonoy
      time: Date.now(), // Current time,
      removeLaterAt: NaN
   },
   {
      country: "PH",
      uuid: "16b92be6-b24a-4d1e-9b42-073c48d1c770",
      name: "DASUTRANSCO",
      route: "tacul_matanao_hagonoy_digos", // Standardized route
      coord: "6.684237, 125.296051",  // Coordinates near Poblacion Hagonoy
      time: Date.now(), // Current time,
      removeLaterAt: NaN
   },
   {
      country: "PH",
      uuid: "cd6d6e5d-4a22-43a0-bd48-78f9ab710fa7",
      name: "DASUTRANSCO",
      route: "digos_hagonoy_matano_tacul", // Standardized route
      coord: "6.684179, 125.295993",  // Coordinates within Poblacion Hagonoy
      time: Date.now(), // Current time,
      removeLaterAt: NaN
   },
   {
      country: "PH",
      uuid: "cd6d6e5d-4a22-43a0-cd12-78f9ab710fa7",
      name: "DASUTRANSCO",
      route: "digos_hagonoy_matano_tacul", // Standardized route
      coord: "6.925434239812144, 125.06962871573384",  // Coordinates within Poblacion Hagonoy
      time: Date.now(), // Current time,
      removeLaterAt: NaN
   },
   {
      country: "PH",
      uuid: "c36d6c5d-4a22-43a0-cd12-78f9ab710fa7",
      name: "DASUTRANSCO",
      route: "digos_hagonoy_matano_tacul", // Standardized route
      coord: "7.618812290065919, 124.57387068381021",  // Coordinates within Poblacion Hagonoy
      time: Date.now(), // Current time,
      removeLaterAt: NaN
   }
];

function haddleReconnect() {
   if (!reconnectInterval) {
      reconnectInterval = setInterval(()=>{
         console.log("Reconnecting...");
         startSocket();
      }, reconnectTimeout)
      
   }

}

function startSocket() {
   webSocket = new WebSocket("ws://127.0.0.1:3510/connect");

   webSocket.onopen = function () {
      if (reconnectInterval) {
         clearInterval(reconnectInterval);
         reconnectInterval = null;
      }
   };

   webSocket.onclose = function() {
      haddleReconnect();
   }

   webSocket.onerror = function (error) {
      webSocket!.close(); // Close the WebSocket in case of error
   };
}

function sendSocket() {
   if (webSocket && webSocket.readyState === webSocket.CLOSED) {
      webSocket = null;
      startSocket();
   } else if (webSocket && webSocket.readyState === webSocket.OPEN) {
      for (let sample of sampleData) {
         webSocket?.send(JSON.stringify(sample));
      }
   } 

}

setInterval(()=>{
   sendSocket();
}, 3000)

startSocket();