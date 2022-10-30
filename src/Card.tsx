import React from "react";
import { CleanedOverpassResponse } from "./drawmap";

interface Props {
  item: CleanedOverpassResponse;
}
function CommonDetails(props: { item: CleanedOverpassResponse }) {
  const { item } = props;
  const mapillaryId = item.tags.mapillary;

  return (
    <div>
      {mapillaryId ? (
        <div>
          <p>
            <a
              href={`https://mapillary.com/app/?focus=photo&pKey=${mapillaryId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View close up photo of this object on Mapillary (ID {mapillaryId})
            </a>
          </p>

          <iframe
            title="Mapillary viewer"
            width="100%"
            height="200"
            src={`https://www.mapillary.com/embed?map_style=OpenStreetMap&image_key=${mapillaryId}&style=photo`}
            frameBorder="0"
          ></iframe>
        </div>
      ) : null}
      <p>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={`https://www.openstreetmap.org/node/${item.id}`}
        >
          Additional details (OSM node {item.id})
        </a>
      </p>
    </div>
  );
}
function UnknownItem(props: { item: CleanedOverpassResponse }) {
  const { item } = props;
  return (
    <div>
      <p style={{ marginLeft: 4 }}>{JSON.stringify(item, null, 2)}</p>
    </div>
  );
}

function TelephoneDetails(props: { item: CleanedOverpassResponse }) {
  return (
    <div>
      <h2>Telephone</h2>
    </div>
  );
}
function QMSPanelDetails(props: { item: CleanedOverpassResponse }) {
  const { item } = props;
  return (
    <div>
      <h2>QMS screen</h2>
      <p>Ref: {(item.tags as any).ref}</p>
    </div>
  );
}
function KioskDetails(props: { item: CleanedOverpassResponse }) {
  return (
    <div>
      <h2>Kiosk (City of Sydney)</h2>
      <p>This may become a QMS panel in future.</p>
    </div>
  );
}

function GenerateCardDetails(props: { item: CleanedOverpassResponse }) {
  const { item } = props;

  if ((item.tags as any).amenity === "telephone") {
    return <TelephoneDetails item={item}></TelephoneDetails>;
  } else if (
    (item.tags as any).operator === "QMS" &&
    (item.tags as any).advertising === "poster_box"
  ) {
    return <QMSPanelDetails item={item}></QMSPanelDetails>;
  } else if (
    (item.tags as any).shop === "kiosk" &&
    (item.tags as any).operator?.toLowerCase() === "city of sydney"
  ) {
    return <KioskDetails item={item}></KioskDetails>;
  } else {
    return <UnknownItem item={item}></UnknownItem>;
  }
}

export default function Card(props: Props) {
  const { item } = props;

  console.log("Rendering card");
  return (
    <div>
      <div
        style={{
          display: "flex",
          margin: "8px 0",
          flexDirection: "column",
        }}
      >
        <GenerateCardDetails item={item}></GenerateCardDetails>
        <CommonDetails item={item}></CommonDetails>
        {/* <p style={{ marginLeft: 4 }}>{JSON.stringify(item, null, 2)}</p> */}
        {/* <p style={{marginLeft: 4}}>{item.Fulldescription}</p> */}
      </div>
    </div>
  );
}
