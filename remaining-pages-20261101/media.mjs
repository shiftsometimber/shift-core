import p0 from "./photo-editorial.mjs";
import p1 from "./photo-reviews.mjs";
import p2 from "./photo-lifestyle.mjs";
const records={"/assets/remaining-pages-20261101/editorial.webp":p0,"/assets/remaining-pages-20261101/reviews.webp":p1,"/assets/remaining-pages-20261101/lifestyle.webp":p2};
export const media=path=>records[path]?Uint8Array.from(atob(records[path]),c=>c.charCodeAt(0)):null;
