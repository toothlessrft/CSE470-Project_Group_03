// Used by the notification panels' "Go to page" buttons. A plain
// react-router navigate() to the route the user is already on is a no-op -
// nothing re-renders, nothing re-fetches, so the button looks broken. Force
// a full reload in that one case so the page's data is actually refreshed;
// otherwise navigate normally.
export function goToLink(navigate, link) {
  if (!link) return;
  if (link === window.location.pathname) {
    window.location.href = link;
    return;
  }
  navigate(link);
}
