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

  if (requiredElements.every(Boolean) && cards.length > 0) {
    const mobileLayout = window.matchMedia('(max-width: 700px)');
    let index = 0;
    let pointerStartX = null;
    let autoplayTimer = null;
    let autoplayPaused = false;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const autoplayDelay = 12000;

    const stopAutoplay = () => {
      if (autoplayTimer !== null) {
        window.clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    };

    const startAutoplay = () => {
      const visibleCount = mobileLayout.matches ? 1 : 3;
      if (autoplayTimer !== null || autoplayPaused || reducedMotion.matches || document.hidden || cards.length <= visibleCount) {
        return;
      }

      autoplayTimer = window.setInterval(() => {
        const currentVisibleCount = mobileLayout.matches ? 1 : 3;
        const maxIndex = Math.max(0, cards.length - currentVisibleCount);
        index = index >= maxIndex ? 0 : index + 1;
        updateCarousel();
      }, autoplayDelay);
    };

    const pauseAutoplay = () => {
      autoplayPaused = true;
      stopAutoplay();
    };

    const resumeAutoplay = () => {
      autoplayPaused = false;
      startAutoplay();
    };

    const restartAutoplay = () => {
      stopAutoplay();
      startAutoplay();
    };

    testimonialCarousel.tabIndex = 0;

    const updateCarousel = () => {
      const visibleCount = mobileLayout.matches ? 1 : 3;
      const maxIndex = Math.max(0, cards.length - visibleCount);
      index = Math.max(0, Math.min(index, maxIndex));

      const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
      const cardWidth = cards[0].getBoundingClientRect().width;
      track.style.transform = `translateX(${index * (cardWidth + gap)}px)`;

      cards.forEach((card, cardIndex) => {
        const isVisible = cardIndex >= index && cardIndex < index + visibleCount;
        card.inert = !isVisible;
        card.setAttribute('aria-hidden', String(!isVisible));
      });

      previousButton.disabled = index === 0;
      nextButton.disabled = index === maxIndex;

      const first = cards.length ? index + 1 : 0;
      const last = Math.min(index + visibleCount, cards.length);
      count.textContent = `${first.toLocaleString('ar')}–${last.toLocaleString('ar')} من ${cards.length.toLocaleString('ar')}`;
    };

    previousButton.addEventListener('click', () => {
      index -= 1;
      updateCarousel();
      restartAutoplay();
    });

    nextButton.addEventListener('click', () => {
      index += 1;
      updateCarousel();
      restartAutoplay();
    });

    cards.forEach((card) => {
      card.addEventListener('mouseenter', pauseAutoplay);
      card.addEventListener('mouseleave', resumeAutoplay);
    });

    testimonialCarousel.addEventListener('focusin', pauseAutoplay);
    testimonialCarousel.addEventListener('focusout', (event) => {
      if (!testimonialCarousel.contains(event.relatedTarget)) {
        resumeAutoplay();
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopAutoplay();
      } else {
        startAutoplay();
      }
    });

    if (reducedMotion.addEventListener) {
      reducedMotion.addEventListener('change', () => {
        if (reducedMotion.matches) {
          stopAutoplay();
        } else {
          startAutoplay();
        }
      });
    }

    testimonialCarousel.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        nextButton.click();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        previousButton.click();
      }
    });

    viewport.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || event.target.closest('button')) {
        return;
      }
      pointerStartX = event.clientX;
    });

    viewport.addEventListener('pointerup', (event) => {
      if (pointerStartX === null) {
        return;
      }

      const delta = event.clientX - pointerStartX;
      pointerStartX = null;

      if (Math.abs(delta) > 40) {
        (delta < 0 ? nextButton : previousButton).click();
      }
    });

    viewport.addEventListener('pointercancel', () => {
      pointerStartX = null;
    });

    if (mobileLayout.addEventListener) {
      mobileLayout.addEventListener('change', updateCarousel);
    } else {
      mobileLayout.addListener(updateCarousel);
    }

    if ('ResizeObserver' in window) {
      new ResizeObserver(updateCarousel).observe(viewport);
    } else {
      window.addEventListener('resize', updateCarousel, { passive: true });
    }

    updateCarousel();
    startAutoplay();
  }
}
