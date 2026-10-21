'use strict';
// Level of the day: same level for everyone on a given UTC date.
function dayNumber(date) {
  return Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86400000);
}
function gcd(a, b) { return b ? gcd(b, a % b) : a; }
function dailyIndex(date, count) {
  let stride = 7;
  while (gcd(stride, count) !== 1) stride++;
  return (dayNumber(date) * stride) % count;
}
function shareText(date, tiles, url) {
  const d = date.toISOString().slice(0, 10);
  return 'onepath daily ' + d + ': filled ' + tiles + ' tiles (the only solution)\n' + url;
}
const dailyApi = { dayNumber, dailyIndex, shareText };
if (typeof module !== 'undefined') module.exports = dailyApi;
else window.Daily = dailyApi;
