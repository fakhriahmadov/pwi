/** Country → region, used to tag each fortune automatically. Unknown countries fall back to "Other". */
const R: Record<string, string[]> = {
  Europe: ["Albania","Andorra","Austria","Belarus","Belgium","Bosnia and Herzegovina","Bulgaria","Croatia","Cyprus","Czech Republic","Czechia","Denmark","Estonia","Finland","France","Georgia","Germany","Greece","Hungary","Iceland","Ireland","Italy","Kosovo","Latvia","Liechtenstein","Lithuania","Luxembourg","Malta","Moldova","Monaco","Montenegro","Netherlands","North Macedonia","Norway","Poland","Portugal","Romania","Russia","San Marino","Serbia","Slovakia","Slovenia","Spain","Sweden","Switzerland","Turkey","Türkiye","Ukraine","United Kingdom","UK","Armenia","Azerbaijan"],
  "North America": ["United States","USA","US","Canada","Mexico"],
  "Latin America": ["Argentina","Bolivia","Brazil","Chile","Colombia","Costa Rica","Dominican Republic","Ecuador","Guatemala","Panama","Paraguay","Peru","Uruguay","Venezuela","Belize","Barbados","Bahamas","Cayman Islands","Jamaica","Trinidad and Tobago"],
  "Asia-Pacific": ["Australia","Bangladesh","Cambodia","China","Hong Kong","India","Indonesia","Japan","Kazakhstan","Macau","Malaysia","Mongolia","Nepal","New Zealand","Pakistan","Philippines","Singapore","South Korea","Korea","Sri Lanka","Taiwan","Thailand","Uzbekistan","Vietnam"],
  "Middle East & Africa": ["Algeria","Bahrain","Egypt","Eswatini","Ethiopia","Ghana","Iran","Iraq","Israel","Jordan","Kenya","Kuwait","Lebanon","Morocco","Nigeria","Oman","Qatar","Saudi Arabia","South Africa","Tanzania","Tunisia","Uganda","United Arab Emirates","UAE","Zimbabwe","Angola","Cyprus (North)"],
};
const MAP = new Map<string, string>();
for (const [region, list] of Object.entries(R)) for (const c of list) MAP.set(c.toLowerCase(), region);

export const REGIONS = Object.keys(R);
export const regionOf = (country: string) => MAP.get(country.trim().toLowerCase()) ?? "Other";
