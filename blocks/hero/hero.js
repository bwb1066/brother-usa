export default function decorate(block) {
  // Extract picture as background
  const pic = block.querySelector('picture');
  if (pic) {
    const picP = pic.closest('p');
    block.prepend(pic);
    if (picP && !picP.textContent.trim()) picP.remove();
  }

  // Wrap remaining text content in a panel
  const textPanel = document.createElement('div');
  textPanel.className = 'hero-text';

  const heading = block.querySelector('h1, h2');
  if (heading) textPanel.append(heading);

  // Grab remaining text elements (h3, h4, p, etc.)
  const textEls = block.querySelectorAll('h3, h4, p');
  textEls.forEach((el) => textPanel.append(el));

  block.append(textPanel);
}
