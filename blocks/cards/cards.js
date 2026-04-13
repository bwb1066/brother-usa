import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  const rows = [...block.children];

  // Check if first row is a header (has heading but no picture)
  const firstRow = rows[0];
  const firstHasPicture = firstRow.querySelector('picture');
  if (!firstHasPicture) {
    // Treat first row as section header
    const header = document.createElement('div');
    header.className = 'cards-header';
    while (firstRow.firstElementChild) {
      while (firstRow.firstElementChild.firstChild) {
        header.append(firstRow.firstElementChild.firstChild);
      }
      firstRow.firstElementChild.remove();
    }
    firstRow.remove();
    block.prepend(header);
  }

  // Remaining rows become card items
  const ul = document.createElement('ul');
  [...block.querySelectorAll(':scope > div')].forEach((row) => {
    if (row.classList.contains('cards-header')) return;
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(
      createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]),
    );
  });

  // Remove original rows (not the header)
  [...block.querySelectorAll(':scope > div:not(.cards-header)')].forEach((r) => r.remove());
  block.append(ul);
}
