'use strict';

const year = document.getElementById('year');

if (year) {
  year.textContent = new Date().getFullYear();
}

const videoContainer = document.querySelector('.video-player');
const videoPlayButton = document.querySelector('.video-play-button');

const getYouTubeVideoId = (value) => {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    let videoId = '';

    if (host === 'youtu.be') {
      videoId = url.pathname.split('/').filter(Boolean)[0] || '';
    } else if (['youtube.com', 'm.youtube.com', 'youtube-nocookie.com'].includes(host)) {
      videoId = url.pathname === '/watch'
        ? url.searchParams.get('v') || ''
        : url.pathname.match(/^\/(?:embed|shorts)\/([^/?]+)/)?.[1] || '';
    }

    return /^[a-zA-Z0-9_-]{11}$/.test(videoId) ? videoId : null;
  } catch {
    return null;
  }
};

if (videoContainer && videoPlayButton) {
  videoPlayButton.addEventListener('click', () => {
    const videoId = getYouTubeVideoId(videoContainer.dataset.youtubeUrl || '');

    if (!videoId) {
      videoPlayButton.setAttribute('aria-label', 'أضف رابط فيديو يوتيوب في إعدادات الصفحة');
      return;
    }

    const player = document.createElement('iframe');
    player.className = 'youtube-player';
    player.title = 'فيديو خلك فاهم';
    player.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&controls=1&fs=1&rel=0&playsinline=1`;
    player.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    player.allowFullscreen = true;
    player.referrerPolicy = 'strict-origin-when-cross-origin';
    player.loading = 'eager';
    videoContainer.replaceWith(player);
    videoPlayButton.hidden = true;
  });
}

const testimonialCarousel = document.querySelector('.testimonial-carousel');

if (testimonialCarousel) {
  const viewport = testimonialCarousel.querySelector('.cards-viewport');
  const track = testimonialCarousel.querySelector('.cards');
  const previousButton = testimonialCarousel.querySelector('[data-carousel-prev]');
  const nextButton = testimonialCarousel.querySelector('[data-carousel-next]');
  const count = testimonialCarousel.querySelector('.carousel-count');
  const cards = track ? Array.from(track.children) : [];
  const requiredElements = [viewport, track, previousButton, nextButton, count];

  if (requiredElements.every(Boolean) && cards.length > 1) {
    const mobileLayout = window.matchMedia('(max-width: 700px)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const speed = 18;
    let offset = 0;
    let loopWidth = 0;
    let cardStep = 0;
    let lastFrame = 0;
    let hoverPaused = false;
    let focusPaused = false;
    let dragging = false;

    const firstGroup = document.createElement('div');
    firstGroup.className = 'cards-group';
    firstGroup.setAttribute('role', 'list');
    cards.forEach((card) => {
      card.setAttribute('role', 'listitem');
      firstGroup.appendChild(card);
    });

    const secondGroup = firstGroup.cloneNode(true);
    secondGroup.setAttribute('aria-hidden', 'true');
    secondGroup.inert = true;
    track.replaceChildren(firstGroup, secondGroup);

    const visibleCount = () => mobileLayout.matches ? 1 : 3;

    const updateCount = () => {
      if (!cardStep) {
        return;
      }
      const first = Math.floor(offset / cardStep) % cards.length;
      const last = (first + visibleCount() - 1) % cards.length;
      count.textContent = `${(first + 1).toLocaleString('ar')}–${(last + 1).toLocaleString('ar')} من ${cards.length.toLocaleString('ar')}`;
    };

    const applyOffset = () => {
      if (!loopWidth) {
        return;
      }
      offset = ((offset % loopWidth) + loopWidth) % loopWidth;
      track.style.transform = `translate3d(${-offset}px, 0, 0)`;
      updateCount();
    };

    const measure = () => {
      const phase = loopWidth ? offset / loopWidth : 0;
      loopWidth = firstGroup.getBoundingClientRect().width;
      const gap = Number.parseFloat(getComputedStyle(firstGroup).columnGap) || 0;
      cardStep = cards[0].getBoundingClientRect().width + gap;
      offset = phase * loopWidth;
      applyOffset();
    };

    const canMove = () => !hoverPaused && !focusPaused && !dragging && !document.hidden && !reducedMotion.matches;

    const animate = (timestamp) => {
      if (lastFrame === 0) {
        lastFrame = timestamp;
      }
      const elapsed = Math.min(timestamp - lastFrame, 100);
      lastFrame = timestamp;

      if (canMove() && loopWidth > 0) {
        offset += speed * elapsed / 1000;
        if (offset >= loopWidth) {
          offset -= loopWidth;
        }
        track.style.transform = `translate3d(${-offset}px, 0, 0)`;
        updateCount();
      }

      window.requestAnimationFrame(animate);
    };

    const hoverCapable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (hoverCapable) {
      [firstGroup, secondGroup].forEach((group) => {
        group.querySelectorAll('.card').forEach((card) => {
          card.addEventListener('mouseenter', () => { hoverPaused = true; });
          card.addEventListener('mouseleave', () => { hoverPaused = false; });
        });
      });
    }

    testimonialCarousel.addEventListener('focusin', () => { focusPaused = true; });
    testimonialCarousel.addEventListener('focusout', (event) => {
      if (!testimonialCarousel.contains(event.relatedTarget)) {
        focusPaused = false;
      }
    });

    previousButton.disabled = false;
    nextButton.disabled = false;
    previousButton.addEventListener('click', () => {
      offset -= cardStep;
      applyOffset();
    });
    nextButton.addEventListener('click', () => {
      offset += cardStep;
      applyOffset();
    });

    testimonialCarousel.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        nextButton.click();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        previousButton.click();
      }
    });

    let pointerStartX = null;
    let dragStartOffset = 0;

    viewport.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || event.target.closest('button') || (event.pointerType === 'mouse' && event.button !== 0)) {
        return;
      }

      pointerStartX = event.clientX;
      dragStartOffset = offset;
      dragging = true;
      viewport.classList.add('is-dragging');
      if (viewport.setPointerCapture) {
        viewport.setPointerCapture(event.pointerId);
      }
    });

    viewport.addEventListener('pointermove', (event) => {
      if (pointerStartX === null) {
        return;
      }

      offset = dragStartOffset - (event.clientX - pointerStartX);
      applyOffset();
    });

    const finishDrag = (event) => {
      if (pointerStartX === null) {
        return;
      }

      pointerStartX = null;
      dragging = false;
      viewport.classList.remove('is-dragging');
      if (event && viewport.hasPointerCapture && viewport.hasPointerCapture(event.pointerId)) {
        viewport.releasePointerCapture(event.pointerId);
      }
    };

    viewport.addEventListener('pointerup', finishDrag);
    viewport.addEventListener('pointercancel', finishDrag);

    if (mobileLayout.addEventListener) {
      mobileLayout.addEventListener('change', measure);
    } else {
      mobileLayout.addListener(measure);
    }
    if ('ResizeObserver' in window) {
      new ResizeObserver(measure).observe(viewport);
    } else {
      window.addEventListener('resize', measure, { passive: true });
    }

    measure();
    window.requestAnimationFrame(animate);
  }
}
