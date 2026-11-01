import {toolsImage} from './tools-image.mjs';

export const TOOLS_IMAGE_PATH = '/tools/assets/ct3-couple-20261031.webp';
export const TOOLS_IMAGE_SHA256 = '57d0f67319af5df93793705af75b6d4dcf4e24cda05f2bbbbdeaf5815834fefc';

// The approved Tools document deliberately uses this absolute URL. Its page
// owner has only document routes; the image must also be served by Core.
export function withApprovedToolsImage(original) {
  return {...original, async fetch(request, ...args) {
    const url = new URL(request.url);
    if (['shiftsometimber.co.uk', 'www.shiftsometimber.co.uk'].includes(url.hostname)
        && ['GET', 'HEAD'].includes(request.method)
        && url.pathname === TOOLS_IMAGE_PATH) {
      return new Response(request.method === 'HEAD' ? null : toolsImage(), {
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Content-Type-Options': 'nosniff',
          'ETag': '"' + TOOLS_IMAGE_SHA256 + '"'
        }
      });
    }
    return original.fetch(request, ...args);
  }};
}
