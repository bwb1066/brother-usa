import {
  buildBlock,
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
} from './aem.js';

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    // Check if h1 or picture is already inside a hero block
    if (h1.closest('.hero') || picture.closest('.hero')) {
      return; // Don't create a duplicate hero block
    }
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // auto load `*/fragments/*` references
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }

    buildHeroBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip buttonization inside cards blocks
    if (a.closest('.cards')) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Decorates disclaimer expanders (strong text followed by an ol/ul).
 * Only runs on the page's main element, not on fragments.
 * @param {HTMLElement} main The main container element
 */
function decorateDisclaimers(main) {
  // Only run on the actual page main, not fragment mains
  if (main !== document.querySelector('main')) return;

  main.querySelectorAll('p > strong').forEach((strong) => {
    const p = strong.closest('p');
    if (!p) return;
    // Skip if inside a block (strong links in blocks shouldn't become disclaimers)
    if (p.querySelector('a')) return;
    const list = p.nextElementSibling;
    if (!list || (list.tagName !== 'OL' && list.tagName !== 'UL')) return;

    const wrapper = document.createElement('details');
    wrapper.className = 'disclaimer';
    const summary = document.createElement('summary');
    summary.textContent = strong.textContent;
    wrapper.append(summary);
    wrapper.append(list);
    p.replaceWith(wrapper);
  });
}

/**
 * Decorates newsletter signup sections.
 * Converts "Stay Connected" h4 + "Subscribe" h4 into a form.
 * @param {HTMLElement} main The main container element
 */
function decorateNewsletter(main) {
  const headings = main.querySelectorAll('h4');
  headings.forEach((h4) => {
    if (h4.textContent.trim() !== 'Stay Connected') return;
    const section = h4.closest('div');
    if (!section) return;

    const nextH4 = h4.nextElementSibling;
    if (!nextH4 || nextH4.tagName !== 'H4') return;

    // Build form
    const wrapper = document.createElement('div');
    wrapper.className = 'newsletter';

    const title = document.createElement('h4');
    title.className = 'newsletter-title';
    title.textContent = 'Stay Connected';

    const required = document.createElement('p');
    required.className = 'newsletter-required';
    required.textContent = '* Required fields';

    const form = document.createElement('form');
    form.className = 'newsletter-form';
    form.addEventListener('submit', (e) => e.preventDefault());

    const input = document.createElement('input');
    input.type = 'email';
    input.placeholder = 'Enter your email here *';
    input.required = true;
    input.className = 'newsletter-input';

    const btn = document.createElement('button');
    btn.type = 'submit';
    btn.className = 'newsletter-btn';
    btn.textContent = 'Subscribe';

    form.append(input, btn);
    wrapper.append(title, required, form);

    h4.replaceWith(wrapper);
    nextH4.remove();
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  // Only run button/disclaimer decoration on page main, not fragments
  const isPageMain = main === document.querySelector('main') || !document.querySelector('main');
  if (isPageMain) {
    decorateButtons(main);
    decorateDisclaimers(main);
    decorateNewsletter(main);
  }
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();


(async function loadDa() {
  if (!new URL(window.location.href).searchParams.get('dapreview')) return;
  // eslint-disable-next-line import/no-unresolved
  import('https://da.live/scripts/dapreview.js').then(({ default: daPreview }) => daPreview(loadPage));
}());
