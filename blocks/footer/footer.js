import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

function cleanExternalLinks(el) {
  el.querySelectorAll('a').forEach((a) => {
    const text = a.textContent;
    if (text.includes('(Opens in a new tab)')) {
      a.textContent = text.replace(/\(Opens in a new tab\)/g, '').trim();
      a.setAttribute('target', '_blank');
      a.classList.add('external');
    }
  });
}

export default async function decorate(block) {
  try {
    const footerMeta = getMetadata('footer');
    const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
    const fragment = await loadFragment(footerPath);

    block.textContent = '';
    const footer = document.createElement('div');
    while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

    const container = footer.querySelector('.section > div')
      || footer.querySelector('div > div')
      || footer.querySelector('div');
    if (!container) { block.append(footer); return; }

    cleanExternalLinks(container);

    // Extract copyright
    let copyright = null;
    const allEls = [...container.children];
    for (let i = allEls.length - 1; i >= 0; i -= 1) {
      if (allEls[i].tagName === 'P' && allEls[i].textContent.includes('Brother International')) {
        copyright = allEls[i];
        break;
      }
    }

    // Extract bottom links: find <hr> and take everything after it
    const bottomLinks = [];
    const hr = container.querySelector('hr');
    if (hr) {
      const hrLi = hr.closest('li');
      if (hrLi) {
        const ul = hrLi.closest('ul');
        const lis = [...ul.querySelectorAll(':scope > li')];
        const hrIdx = lis.indexOf(hrLi);

        // Links after hr in same li
        let afterHr = false;
        [...hrLi.childNodes].forEach((n) => {
          if (n === hr) { afterHr = true; return; }
          if (afterHr && n.nodeType === 1) {
            const a = n.tagName === 'A' ? n : n.querySelector?.('a');
            if (a) bottomLinks.push(a.cloneNode(true));
          }
        });

        // Links in subsequent lis
        for (let i = hrIdx + 1; i < lis.length; i += 1) {
          const a = lis[i].querySelector('a');
          if (a) bottomLinks.push(a.cloneNode(true));
          lis[i].remove();
        }

        hrLi.remove();
      } else {
        hr.remove();
      }
    }

    // Group elements: plain <p> headings start new groups
    const groups = [];
    let cur = [];
    [...container.children].forEach((el) => {
      if (el === copyright) return;
      if (el.tagName === 'P' && !el.querySelector('a') && el.textContent.trim()) {
        if (cur.length) groups.push(cur);
        cur = [el];
      } else {
        cur.push(el);
      }
    });
    if (cur.length) groups.push(cur);

    // Map to 4 columns
    const cols = [[], [], [], []];
    const map = {
      'Brother Support': 0,
      'Corporate Information': 1,
      Resources: 1,
      'Partnership Opportunities': 2,
      'About This Website': 3,
    };

    groups.forEach((g) => {
      const text = g[0].tagName === 'P' ? g[0].textContent.trim() : '';
      const idx = map[text] !== undefined ? map[text] : 0;
      cols[idx].push(...g);
    });

    // Build columns
    const colsDiv = document.createElement('div');
    colsDiv.className = 'footer-columns';
    cols.forEach((c) => {
      const col = document.createElement('div');
      col.className = 'footer-column';
      c.forEach((el) => col.append(el));
      colsDiv.append(col);
    });

    // Mark headings and primary links
    colsDiv.querySelectorAll(':scope > .footer-column > p').forEach((p) => {
      if (!p.querySelector('a')) p.classList.add('footer-heading');
    });
    colsDiv.querySelectorAll('strong > a').forEach((a) => {
      a.classList.add('footer-primary-link');
    });

    // Build bottom bar
    const bottomDiv = document.createElement('div');
    bottomDiv.className = 'footer-bottom';
    const bottomInner = document.createElement('div');
    bottomInner.className = 'footer-bottom-inner';

    if (bottomLinks.length) {
      const linksDiv = document.createElement('div');
      linksDiv.className = 'footer-bottom-links';
      bottomLinks.forEach((a) => linksDiv.append(a));
      cleanExternalLinks(linksDiv);
      bottomInner.append(linksDiv);
    }
    if (copyright) {
      const copyDiv = document.createElement('div');
      copyDiv.className = 'footer-copyright';
      copyDiv.append(copyright);
      bottomInner.append(copyDiv);
    }
    bottomDiv.append(bottomInner);

    container.replaceChildren(colsDiv);
    block.append(footer);
    block.append(bottomDiv);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Footer decoration failed', e);
  }
}
