import React from "react";
import ReactDOM from "react-dom";
import mapboxgl from "mapbox-gl";
import Card from "./Card";
import * as http from "https";

/*
advertising=poster_box
animated=screen
lit=yes
operator=QMS
operator:website=https://www.qmsmedia.com/
sides=2
support=ground
*/

interface PosterBoxInterface {
  advertising?: "yes" | "poster_box";
  operator?: "QMS" | string;
  animated?: "screen" | "yes" | "no";
  sides?: string;
  lit?: "yes" | "no";
  support?: "ground";
  "operator:website"?: string;
  ref?: string;
  mapillary?: string;
}
interface TelephoneInterface {
  advertising?: "yes" | "no" | "poster_box";
  amenity: "telephone";
  mapillary?: string;
}
interface KioskInterface {
  shop: "kiosk";
  mapillary?: string;
}

export interface RawOverpassResponse {
  type: "node";
  id: number;
  lat: number;
  lon: number;
  tags: PosterBoxInterface | TelephoneInterface | KioskInterface;
}
export interface CleanedOverpassResponse extends RawOverpassResponse {
  // Extra tags
}

export function processOsmData(
  input: RawOverpassResponse[]
): CleanedOverpassResponse[] {
  return (
    input
      // @ts-ignore
      .filter((item) => item.tags.advertising !== "no")
      .map((cafe) => {
        return {
          ...cafe,
        };
      })
  );
}

// southern-most latitude, western-most longitude, northern-most latitude, eastern-most longitude.
export async function getOSMData(
  bounds: number[]
): Promise<RawOverpassResponse[]> {
  const options = {
    hostname: "overpass-api.de",
    port: 443,
    path: "/api/interpreter",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };
  console.log("Started POST request...");
  const boundsStr = bounds.join(",");
  const request_str = `
    [out:json][timeout:25];
    (
        node["advertising"](${boundsStr});
        node["amenity"="telephone"]["advertising"="no"](${boundsStr});
        node["shop"="kiosk"]["operator"="City of Sydney"](${boundsStr});
    );
    out body;
    >;
    out skel qt;
    `;
  console.log("request:", request_str);

  return new Promise((resolve, reject) => {
    var req = http.request(options, function (res) {
      var body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => (body += chunk));
      res.on("end", function () {
        if (res.statusCode !== 200) {
          console.log("error code", res.statusCode);
          reject(res.statusCode);
        }

        const jsonResponse = JSON.parse(body);
        const bars: RawOverpassResponse[] = jsonResponse.elements;
        resolve(bars);
      });
    });
    req.on("error", function (e) {
      reject(e.message);
    });
    req.write(request_str);
    req.end();
  });
}

export function drawMarker(
  item: CleanedOverpassResponse,
  map: mapboxgl.Map
): mapboxgl.Marker {
  const { lat, lon } = item;

  const placeholder = document.createElement("div");
  ReactDOM.render(<Card item={item} />, placeholder);

  var popup = new mapboxgl.Popup({
    // offset: 25,
    // closeOnMove: true,
    anchor: "bottom", // make the popup appear above the pin
  }).setDOMContent(placeholder);

  let markerOptions: mapboxgl.MarkerOptions = {};
  markerOptions.scale = 0.7;

  // @ts-ignore
  if (item.tags.operator === "QMS") {
    markerOptions.color = "red";
    // @ts-ignore
  } else if (item.tags.advertising === "poster_box") {
    markerOptions.color = "orange";
    // @ts-ignore
  } else if (item.tags.amenity === "telephone") {
    markerOptions.color = "#66000000"; //"green";
    // @ts-ignore
  } else if (item.tags.shop === "kiosk") {
    markerOptions.color = "blue";
  } else {
    markerOptions.color = "gray";
  }

  const marker = new mapboxgl.Marker(markerOptions)
    .setLngLat([lon, lat])
    .setPopup(popup) // sets a popup on this marker
    .addTo(map);

  if (window.orientation !== undefined) {
    marker.getElement().addEventListener("click", (e) => {
      map.flyTo({
        center: [lon, lat],
      });
    });
  }
  return marker;
}

export function drawmap(map: mapboxgl.Map): void {
  map.addControl(new mapboxgl.NavigationControl());
  map.addControl(new mapboxgl.FullscreenControl());
  // Add geolocate control to the map.
  map.addControl(
    new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
    })
  );

  map.on("moveend", function (originalEvent) {
    const { lat, lng } = map.getCenter();
    console.log("A moveend event occurred.");
    console.log({ lat, lng });

    // eg https://localhost:3000
    const location = window.location.origin;
    console.log({ location });
  });
}
export function removeMarkers(markers: mapboxgl.Marker[]): void {
  markers.map((marker) => marker.remove());
}

export function drawMarkers(
  map: mapboxgl.Map,
  points: CleanedOverpassResponse[]
): mapboxgl.Marker[] {
  const markers = points
    .filter((point) => point.lat && point.lon)
    .map((node: CleanedOverpassResponse) => {
      return drawMarker(node, map);
    });

  return markers;
}
