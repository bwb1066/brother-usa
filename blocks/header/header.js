import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta
    ? new URL(navMeta, window.location).pathname
    : '/nav';
  const fragment = await loadFragment(navPath);
  if (!fragment) return;

  block.textContent = '';

  // Fragment has 2 divs: utility bar content, main nav content
  const sections = [...fragment.querySelectorAll(':scope > div')];
  const utilSection = sections[0]; // logo, search, cart, a11y, account
  const navSection = sections[1]; // Home, Business, mega menu

  // ── Utility bar ──
  const utilBar = document.createElement('div');
  utilBar.className = 'nav-utility';

  const utilInner = document.createElement('div');
  utilInner.className = 'nav-utility-inner';

  if (utilSection) {
    // Logo (first picture)
    const logoPic = utilSection.querySelector('picture');
    if (logoPic) {
      const logoLink = document.createElement('a');
      logoLink.href = '/';
      logoLink.className = 'nav-logo';
      logoLink.setAttribute('aria-label', 'Brother Home');
      logoLink.append(logoPic);
      utilInner.append(logoLink);
    }

    // Home / Business tabs
    const tabs = document.createElement('div');
    tabs.className = 'nav-tabs';
    utilSection.querySelectorAll('a').forEach((a) => {
      const text = a.textContent.trim();
      if (text === 'For Home' || text === 'For Business') {
        const tab = document.createElement('a');
        tab.href = a.href;
        tab.className = 'nav-tab';
        tab.textContent = text;
        if (text === 'For Business') tab.classList.add('active');
        tabs.append(tab);
      }
    });
    if (tabs.children.length) utilInner.append(tabs);

    // Right side: search, accessibility, cart, account
    const utilRight = document.createElement('div');
    utilRight.className = 'nav-util-right';

    // Search
    const searchText = utilSection.textContent;
    const searchMatch = searchText.match(/Search .+ here/);
    const searchWrap = document.createElement('div');
    searchWrap.className = 'nav-search-bar';
    searchWrap.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><input type="text" placeholder="${searchMatch ? searchMatch[0] : 'Search here...'}" aria-label="Search">`;
    utilRight.append(searchWrap);

    // Accessibility icon (from DA content)
    const a11yLink = utilSection.querySelector('a[href*="levelaccess"]');
    if (a11yLink) {
      const a11y = document.createElement('a');
      a11y.href = a11yLink.href;
      a11y.className = 'nav-a11y';
      a11y.setAttribute('aria-label', 'Accessibility');
      const a11yPic = a11yLink.querySelector('picture');
      if (a11yPic) a11y.append(a11yPic);
      utilRight.append(a11y);
    }

    // Cart
    const cartLink = utilSection.querySelector('a[href*="cart"]');
    if (cartLink) {
      const cart = document.createElement('a');
      cart.href = cartLink.href;
      cart.className = 'nav-cart';
      cart.setAttribute('aria-label', 'Cart');
      cart.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg><span class="nav-cart-count">0</span>';
      utilRight.append(cart);
    }

    // Account
    const accountWrap = document.createElement('div');
    accountWrap.className = 'nav-account';
    accountWrap.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M5 20c0-3.87 3.13-7 7-7s7 3.13 7 7"/></svg><span>Account</span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>';
    utilRight.append(accountWrap);

    utilInner.append(utilRight);
  }

  utilBar.append(utilInner);

  // ── Main nav bar ──
  const mainNav = document.createElement('nav');
  mainNav.id = 'nav';
  mainNav.className = 'nav-main';

  const navInner = document.createElement('div');
  navInner.className = 'nav-main-inner';

  if (navSection) {
    // The nav content is a nested <ul> structure
    const topUl = navSection.querySelector('ul');
    if (topUl) {
      const items = [...topUl.querySelectorAll(':scope > li')];
      items.forEach((li) => {
        const link = li.querySelector(':scope > p > a');
        if (!link) return;

        const text = link.textContent.trim();
        const subUl = li.querySelector(':scope > ul');

        const item = document.createElement('div');
        item.className = 'nav-item';

        const btn = document.createElement('button');
        btn.className = 'nav-item-label';
        btn.type = 'button';
        btn.textContent = text;

        if (subUl) {
          btn.setAttribute('aria-expanded', 'false');
          btn.innerHTML = `${text} <svg class="nav-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>`;

          const dropdown = document.createElement('div');
          dropdown.className = 'nav-dropdown';

          const subItems = [...subUl.querySelectorAll(':scope > li')];

          // Detect flat list (all items are direct <a>, no <p> or <ul>)
          const isFlat = subItems.every(
            (el) => el.querySelector(':scope > a') && !el.querySelector('ul'),
          );

          if (isFlat) {
            dropdown.classList.add('nav-dropdown-flat');
            const flatList = document.createElement('div');
            flatList.className = 'nav-dd-flat';
            subItems.forEach((flatLi) => {
              const flatA = flatLi.querySelector('a');
              if (flatA) {
                const flatLink = document.createElement('a');
                flatLink.href = flatA.href;
                flatLink.className = 'nav-dd-flat-link';
                flatLink.textContent = flatA.textContent.trim();
                flatList.append(flatLink);
              }
            });
            dropdown.append(flatList);
            item.append(btn);
            item.append(dropdown);

            btn.addEventListener('click', () => {
              const expanded = btn.getAttribute('aria-expanded') === 'true';
              navInner.querySelectorAll(
                '.nav-item-label[aria-expanded="true"]',
              ).forEach((b) => {
                b.setAttribute('aria-expanded', 'false');
              });
              btn.setAttribute(
                'aria-expanded',
                expanded ? 'false' : 'true',
              );
            });

            navInner.append(item);
            return;
          }

          // Detect direct columns layout (all sub-items have <strong>
          // headings, none have sub-sub selectors)
          const hasSubSelectors = subItems.some(
            (el) => el.querySelector(':scope > p > a')
              && el.querySelector(':scope > ul > li > ul'),
          );

          if (!hasSubSelectors) {
            // Direct columns + promo layout (like Solutions)
            const directContent = document.createElement('div');
            directContent.className = 'nav-dd-right-content';
            let directPromo = '';

            subItems.forEach((si) => {
              const pTxt = si.querySelector(':scope > p')
                ?.textContent.trim();
              if (pTxt && pTxt.includes('**promo')) {
                const pLi = si.querySelector(':scope > ul > li');
                if (pLi) {
                  const promo = document.createElement('div');
                  promo.className = 'nav-dd-promo';
                  let titleSet = false;
                  [...pLi.querySelectorAll(':scope > p')].forEach((p) => {
                    const pic = p.querySelector('picture');
                    if (pic) {
                      promo.append(pic);
                    } else if (!titleSet && !p.querySelector('a')) {
                      const d = document.createElement('div');
                      d.className = 'nav-dd-promo-title';
                      d.textContent = p.textContent.trim();
                      promo.append(d);
                      titleSet = true;
                    } else {
                      const d = document.createElement('div');
                      d.className = 'nav-dd-promo-desc';
                      d.innerHTML = p.innerHTML;
                      promo.append(d);
                    }
                  });
                  directPromo = promo.outerHTML;
                }
                return;
              }
              const colDiv = document.createElement('div');
              colDiv.className = 'nav-dd-col';
              const hd = si.querySelector(':scope > p > strong');
              if (hd) {
                const h = document.createElement('div');
                h.className = 'nav-dd-col-heading';
                h.textContent = hd.textContent;
                colDiv.append(h);
              }
              const cUl = si.querySelector(':scope > ul');
              if (cUl) {
                [...cUl.querySelectorAll(':scope > li')].forEach((cLi) => {
                  const cA = cLi.querySelector('a');
                  if (cA) {
                    const a = document.createElement('a');
                    a.href = cA.href;
                    a.className = 'nav-dd-link';
                    a.textContent = cA.textContent.trim();
                    colDiv.append(a);
                  }
                });
              }
              directContent.append(colDiv);
            });

            if (directPromo) {
              const wrap = document.createElement('div');
              wrap.className = 'nav-dd-right-with-promo';
              const colsWrap = document.createElement('div');
              colsWrap.className = 'nav-dd-cols-grid';
              while (directContent.firstChild) {
                colsWrap.append(directContent.firstChild);
              }
              wrap.append(colsWrap);
              wrap.insertAdjacentHTML('beforeend', directPromo);
              directContent.append(wrap);
            }

            const directPanel = document.createElement('div');
            directPanel.className = 'nav-dd-direct';
            directPanel.append(directContent);
            dropdown.append(directPanel);
            item.append(btn);
            item.append(dropdown);

            btn.addEventListener('click', () => {
              const exp = btn.getAttribute('aria-expanded') === 'true';
              navInner.querySelectorAll(
                '.nav-item-label[aria-expanded="true"]',
              ).forEach((b) => {
                b.setAttribute('aria-expanded', 'false');
              });
              btn.setAttribute(
                'aria-expanded',
                exp ? 'false' : 'true',
              );
            });

            navInner.append(item);
            return;
          }

          // Build two-panel dropdown
          // Get heading from first <li> if it has <strong> and no link
          const firstItem = subItems[0];
          const headingStrong = firstItem?.querySelector(':scope > p > strong');
          const hasHeadingOnly = headingStrong && !firstItem.querySelector('a');

          if (hasHeadingOnly) {
            const heading = document.createElement('div');
            heading.className = 'nav-dd-heading';
            heading.textContent = headingStrong.textContent;
            dropdown.append(heading);
            subItems.shift(); // remove heading from list
          }

          const leftPanel = document.createElement('div');
          leftPanel.className = 'nav-dd-left';

          const rightPanel = document.createElement('div');
          rightPanel.className = 'nav-dd-right';

          subItems.forEach((subLi) => {
            const subLink = subLi.querySelector(':scope > p > a');
            const subSub = subLi.querySelector(':scope > ul');
            const subText = subLink
              ? subLink.textContent.trim()
              : (subLi.querySelector(':scope > p')?.textContent.trim() || '');

            const row = document.createElement('a');
            row.href = subLink ? subLink.href : '#';
            row.className = 'nav-dd-item';
            row.textContent = subText;

            if (subSub) {
              row.href = '#';
              row.addEventListener('click', (e) => e.preventDefault());
              row.innerHTML = `${subText}<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 6 6 6-6 6"/></svg>`;

              // Build right panel content for this item
              const rightContent = document.createElement('div');
              rightContent.className = 'nav-dd-right-content';

              const cols = [...subSub.querySelectorAll(':scope > li')];
              let promoHtml = '';
              cols.forEach((col) => {
                const pText = col.querySelector(':scope > p')
                  ?.textContent.trim();
                // Detect promo card
                if (pText && pText.includes('**promo')) {
                  const promoLi = col.querySelector(':scope > ul > li');
                  if (promoLi) {
                    const promo = document.createElement('div');
                    promo.className = 'nav-dd-promo';
                    const ps = [...promoLi.querySelectorAll(':scope > p')];
                    let titleDone = false;
                    ps.forEach((p) => {
                      const pic = p.querySelector('picture');
                      if (pic) {
                        promo.append(pic);
                      } else if (!titleDone && !p.querySelector('a')) {
                        const div = document.createElement('div');
                        div.className = 'nav-dd-promo-title';
                        div.textContent = p.textContent.trim();
                        promo.append(div);
                        titleDone = true;
                      } else {
                        const div = document.createElement('div');
                        div.className = 'nav-dd-promo-desc';
                        div.innerHTML = p.innerHTML;
                        promo.append(div);
                      }
                    });
                    promoHtml = promo.outerHTML;
                  }
                  return;
                }
                const colDiv = document.createElement('div');
                colDiv.className = 'nav-dd-col';
                const colHeading = col.querySelector(
                  ':scope > p > strong',
                );
                if (colHeading) {
                  const h = document.createElement('div');
                  h.className = 'nav-dd-col-heading';
                  h.textContent = colHeading.textContent;
                  colDiv.append(h);
                }
                const colUl = col.querySelector(':scope > ul');
                if (colUl) {
                  [...colUl.querySelectorAll(':scope > li')].forEach(
                    (cLi) => {
                      const cLink = cLi.querySelector('a');
                      if (cLink) {
                        const a = document.createElement('a');
                        a.href = cLink.href;
                        a.className = 'nav-dd-link';
                        a.textContent = cLink.textContent.trim();
                        colDiv.append(a);
                      }
                    },
                  );
                }
                rightContent.append(colDiv);
              });
              if (promoHtml) {
                // Wrap cols + promo in a flex row
                const wrapper = document.createElement('div');
                wrapper.className = 'nav-dd-right-with-promo';
                const colsWrap = document.createElement('div');
                colsWrap.className = 'nav-dd-cols-grid';
                while (rightContent.firstChild) {
                  colsWrap.append(rightContent.firstChild);
                }
                wrapper.append(colsWrap);
                wrapper.insertAdjacentHTML('beforeend', promoHtml);
                rightContent.append(wrapper);
              }

              row.addEventListener('mouseenter', () => {
                leftPanel.querySelectorAll('.nav-dd-item').forEach((r) => {
                  r.classList.remove('active');
                });
                row.classList.add('active');
                rightPanel.innerHTML = '';
                rightPanel.append(rightContent.cloneNode(true));
              });
            }

            leftPanel.append(row);
          });

          const panels = document.createElement('div');
          panels.className = 'nav-dd-panels';
          panels.append(leftPanel);
          panels.append(rightPanel);
          dropdown.append(panels);

          item.append(btn);
          item.append(dropdown);

          btn.addEventListener('click', () => {
            const expanded = btn.getAttribute('aria-expanded') === 'true';
            navInner.querySelectorAll(
              '.nav-item-label[aria-expanded="true"]',
            ).forEach((b) => {
              b.setAttribute('aria-expanded', 'false');
            });
            btn.setAttribute(
              'aria-expanded',
              expanded ? 'false' : 'true',
            );
          });
        } else {
          // Simple link, no dropdown
          const a = document.createElement('a');
          a.href = link.href;
          a.className = 'nav-item-link';
          a.textContent = text;
          item.append(a);
        }

        navInner.append(item);
      });
    }
  }

  mainNav.append(navInner);

  // ── Assemble ──
  const wrapper = document.createElement('div');
  wrapper.className = 'nav-wrapper';
  wrapper.append(utilBar);
  wrapper.append(mainNav);
  block.append(wrapper);

  // Close mega menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!mainNav.contains(e.target)) {
      navInner.querySelectorAll(
        '.nav-item-label[aria-expanded="true"]',
      ).forEach((b) => {
        b.setAttribute('aria-expanded', 'false');
      });
    }
  });
}
