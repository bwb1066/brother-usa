export default function decorate(block) {
  const slides = [...block.children];
  const total = slides.length;

  // Wrap each slide
  slides.forEach((slide, i) => {
    slide.classList.add('carousel-slide');
    if (i === 0) slide.classList.add('active');

    const cols = [...slide.children];
    if (cols.length >= 2) {
      const hasImage = cols[0].querySelector('picture');
      if (hasImage) {
        cols[0].classList.add('carousel-slide-image');
        cols[1].classList.add('carousel-slide-text');
      } else {
        cols[0].classList.add('carousel-slide-text');
        cols[1].classList.add('carousel-slide-image');
      }
    }
  });

  // Navigation
  const nav = document.createElement('div');
  nav.className = 'carousel-nav';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'carousel-arrow carousel-prev';
  prevBtn.setAttribute('aria-label', 'Previous slide');
  prevBtn.textContent = '\u2190';

  const nextBtn = document.createElement('button');
  nextBtn.className = 'carousel-arrow carousel-next';
  nextBtn.setAttribute('aria-label', 'Next slide');
  nextBtn.textContent = '\u2192';

  const dots = document.createElement('div');
  dots.className = 'carousel-dots';
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = `carousel-dot${i === 0 ? ' active' : ''}`;
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dots.append(dot);
  });

  nav.append(prevBtn, dots, nextBtn);
  block.append(nav);

  let current = 0;

  function goTo(index) {
    slides[current].classList.remove('active');
    dots.children[current].classList.remove('active');
    current = (index + total) % total;
    slides[current].classList.add('active');
    dots.children[current].classList.add('active');
  }

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));
}
