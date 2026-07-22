/** Scroll the portal main view back to the top after in-app discovery navigation. */
export const scrollPortalToTop = () => {
    if (typeof window === 'undefined') return;
    window.scrollTo(0, 0);
    const container = document.getElementById('main-scroll-container');
    if (container) container.scrollTop = 0;
};
