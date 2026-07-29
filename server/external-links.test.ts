import { describe, expect, it } from "vitest";
import { SEED_EVENTS } from "../shared/events";
import { SERVICES } from "../shared/services";

const CONFIRMED_BAD_URLS = [
  "https://agency.nationwide.com/nc/charlotte/28205/david-j-jones-agency-inc",
  "https://badaxethrowing.com/locations/axe-throwing-charlotte-nc/",
  "https://britishswimschool.com/charlotte/",
  "https://campnorthend.com/events",
  "https://coomerinsurance.com/",
  "https://majorleaguebarbers.com/",
  "https://montessoricharlotte.org/",
  "https://shardshop.com/charlotte/",
  "https://theepicentre.com/events",
  "https://www.acehandymanservices.com/locations/charlotte-matthews/",
  "https://www.bestimpressionscaterers.com/byrons",
  "https://www.bintheredumpthat.com/charlotte-nc/",
  "https://www.blumenthalarts.org/events/detail/night-market-w-chicas-market",
  "https://www.gohealthuc.com/north-carolina/charlotte/south-end",
  "https://www.kesslercollection.com/grand-bohemian-hotel-charlotte/dining/buho-bar/",
  "https://www.maids.com/159/charlotte-nc/",
  "https://www.mecknc.gov/parkandrec/aquatics/pages/rayssplashplace.aspx",
  "https://www.mecknc.gov/parkandrec/aquatics/rays-splash-planet",
  "https://www.mecknc.gov/ParkandRec/Greenways/Pages/LittleSugarCreekGreenway.aspx",
  "https://www.mecknc.gov/ParkandRec/Parks/Pages/ColonelFrancisBeatty.aspx",
  "https://www.mecknc.gov/ParkandRec/Parks/Pages/ParkRoad.aspx",
  "https://www.mecknc.gov/ParkandRec/Parks/Pages/Reedy-Creek-Park.aspx",
  "https://www.mecknc.gov/ParkandRec/StewardshipServices/NatureCenters/Pages/LattaNatureCenter.aspx",
  "https://www.mecknc.gov/ParkandRec/StewardshipServices/NatureCenters/Pages/LattaPlantation.aspx",
  "https://www.mecknc.gov/ParkandRec/StewardshipServices/NatureCenters/Pages/McDowell.aspx",
  "https://www.mecknc.gov/ParkandRec/StewardshipServices/NatureCenters/Pages/ReedyCreek.aspx",
  "https://www.mecknc.gov/ParkandRec/StewardshipServices/NaturePreserves/Pages/RibbonWalk.aspx",
  "https://www.meineke.com/locations/nc/charlotte-1367/",
  "https://www.meltingpot.com/charlotte-nc/",
  "https://www.ncagr.gov/markets/facilities/markets/charlotte",
  "https://www.novanthealth.org/presbyterian-medical-center",
  "https://www.okurestaurants.com/location/o-ku-charlotte/",
  "https://www.orkin.com/locations/north-carolina/charlotte",
  "https://www.thelashlounge.com/nc-charlotte-southpark/",
  "https://www.urbanair.com/north-carolina-charlotte-south/",
  "https://www.usnwc.org/events/",
  "https://fiber.google.com/charlotte",
  "https://carolinasroofing.com/",
  "https://hssm.com/",
  "https://wiredupsolutions.com/",
  "https://www.mamapasta.com/",
] as const;

function normalizeUrl(value: string): string {
  const url = new URL(value);
  const pathname = url.pathname.replace(/\/+$/, "") || "/";
  return `${url.protocol}//${url.hostname.toLowerCase()}${pathname.toLowerCase()}`;
}

const blockedUrls = new Set(CONFIRMED_BAD_URLS.map(normalizeUrl));

describe("Outbound-link data integrity", () => {
  it("does not publish confirmed broken or parked service websites", () => {
    const offenders = SERVICES.filter(
      service =>
        service.website && blockedUrls.has(normalizeUrl(service.website))
    ).map(service => ({ name: service.name, website: service.website }));

    expect(offenders).toEqual([]);
  });

  it("does not publish confirmed broken or parked event links", () => {
    const offenders = SEED_EVENTS.flatMap(event =>
      [event.sourceUrl, event.organizerWebsite, event.rsvpUrl]
        .filter((url): url is string => Boolean(url))
        .filter(url => blockedUrls.has(normalizeUrl(url)))
        .map(url => ({ name: event.name, url }))
    );

    expect(offenders).toEqual([]);
  });
});
