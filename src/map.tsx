import React, { useRef, useEffect, useState } from "react";
// @ts-ignore
// eslint-disable-next-line
import mapboxgl from "!mapbox-gl";
import "./App.css";
import {
  drawMarkers,
  removeMarkers,
  getOSMData,
  CleanedOverpassResponse,
  processOsmData,
} from "./drawmap";

const MAPBOX_TOKEN =
  "pk.eyJ1IjoiamFrZWMiLCJhIjoiY2tkaHplNGhjMDAyMDJybW4ybmRqbTBmMyJ9.AR_fnEuka8-cFb4Snp3upw";
interface State {
  viewport: {
    longitude: number;
    latitude: number; // starting position
    zoom: number;
  };
  map?: mapboxgl.Map;
  adNode?: CleanedOverpassResponse[];
  markers?: mapboxgl.Marker[];
}

// const params = new URLSearchParams(window.location.search);
// const paramLat = params.get("lat");
// const paramLon = params.get("lon");

// console.log("PARAMS");
// console.log({ lat: paramLat, lon: paramLon });

mapboxgl.accessToken = MAPBOX_TOKEN;

async function fetchAndDrawMarkers(
  map: mapboxgl.Map,
  markers: React.MutableRefObject<mapboxgl.Marker[]>,
  setLoadingStatus: React.Dispatch<React.SetStateAction<LoadingStatusType>>
) {
  setLoadingStatus("loading");
  // const bounds = map.getBounds();
  // const southernLat = bounds.getSouth();
  // const westLong = bounds.getWest();
  // const northLat = bounds.getNorth();
  // const eastLong = bounds.getEast();
  // const overpassBounds = [southernLat, westLong, northLat, eastLong];
  const sydneyOverpassBounds = [
    -34.11748941036342, 150.7715606689453, -33.59860671494885,
    151.36825561523438,
  ];
  console.log("getting ads");

  try {
    const adsRaw: CleanedOverpassResponse[] = await getOSMData(
      sydneyOverpassBounds
    );
    const ads: CleanedOverpassResponse[] = processOsmData(adsRaw);
    console.log("removing markers");
    removeMarkers(markers.current);
    console.log("Drawing markers");
    markers.current = await drawMarkers(map, ads);
    console.log("Current markers is now", markers.current);
    setLoadingStatus("success");
  } catch (e) {
    setLoadingStatus("unknownerror");
  }
}

type LoadingStatusType = "loading" | "success" | "429error" | "unknownerror";
export function Map() {
  const mapContainer = React.useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [loadingStatus, setLoadingStatus] =
    useState<LoadingStatusType>("success");
  const [lng, setLng] = useState(151.20671);
  const [lat, setLat] = useState(-33.8683861);
  const [zoom, setZoom] = useState(13);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    // @ts-ignore
    map.current = new mapboxgl.Map({
      // @ts-ignore
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [lng, lat],
      zoom: zoom,
    });
    if (map.current) {
      fetchAndDrawMarkers(map.current, markers, setLoadingStatus);
    }
    map.current.addControl(new mapboxgl.NavigationControl());
    map.current.addControl(new mapboxgl.FullscreenControl());
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
      })
    );

    // map.current &&
    //   map.current.on("moveend", async (e) => {
    //     if (map.current === null) {
    //       return;
    //     }
    //     fetchAndDrawMarkers(map.current, markers, setLoadingStatus);
    //   });
  });

  useEffect(() => {
    // console.log('in useEffect');
    if (!map.current) return; // wait for map to initialize

    map.current.on("move", () => {
      if (!map.current) {
        return; // wait for map to initialize
      }

      setLng(map.current.getCenter().lng);
      setLat(map.current.getCenter().lat);
      setZoom(map.current.getZoom());
    });
  });

  const statusMessages = {
    loading: "Loading from OpenStreetMap...",
    success: "Done loading",
    unknownerror: "Error loading data. Please wait a bit",
    "429error": "Too many requests, please try in a bit",
  };

  const statusText = statusMessages[loadingStatus];
  return (
    <div>
      <div className="sidebar">
        <label>
          {" "}
          {statusText} |{" "}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://jakecoppinger.com/2022/10/mapping-sydney-billboards-a-map-of-every-qms-advertising-screen-in-sydney-with-photographs/"
          >
            Intro blog post
          </a> | A side-project by <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://jakecoppinger.com/"
          >
            Jake Coppinger
          </a>
        </label>
      </div>
      <div ref={mapContainer} className="map-container" />
    </div>
  );
}
