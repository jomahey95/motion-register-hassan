/* No dependencies. The only raster assets are the actor frames extracted
   from the supplied reference. The form, validation and layout are native HTML. */
(() => {
  'use strict';

  const scene = document.getElementById('scene');
  const canvas = document.getElementById('character');
  const context = canvas.getContext('2d');
  const registration = document.getElementById('registration');
  const form = document.getElementById('registration-form');
  const success = document.getElementById('success');
  const pauseButton = document.getElementById('pause-motion');
  const replayButton = document.getElementById('replay-motion');
  const pauseIcon = document.getElementById('pause-icon');
  const playIcon = document.getElementById('play-icon');
  const assetStatus = document.getElementById('asset-status');
  const status = document.getElementById('form-status');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const firstName = document.getElementById('first-name');
  const lastName = document.getElementById('last-name');
  const privacyDialog = document.getElementById('privacy-dialog');

  let motion;
  let atlases = [];
  let active = false;
  let elapsed = 0;
  let previousTime = null;
  let requestId = null;
  let currentFrame = -1;
  let usable = false;

  const resize = () => {
    const scale = Math.min(1.65, Math.max(.90, (window.innerWidth - 40) / 664), Math.max(.70, (window.innerHeight - 70) / 400));
    scene.style.setProperty('--scene-scale', scale.toFixed(4));
  };
  window.addEventListener('resize', resize, { passive: true });
  resize();

  const setPlaybackUI = () => {
    pauseIcon.toggleAttribute('hidden', !active);
    playIcon.toggleAttribute('hidden', active);
    pauseButton.setAttribute('aria-label', active ? 'Pause animation' : 'Play animation');
    pauseButton.title = active ? 'Pause animation' : 'Play animation';
  };

  const draw = index => {
    if (!motion || index === currentFrame) return;
    const frame = motion.frames[index];
    const atlas = atlases[frame.atlas];
    context.clearRect(0, 0, motion.width, motion.height);
    if (atlas?.complete && atlas.naturalWidth) {
      context.drawImage(atlas, frame.sx, frame.sy, frame.w, frame.h, frame.x, frame.y, frame.w, frame.h);
    }
    // Use the measured left edge of the reference form, frame by frame.
    registration.style.transform = `translateX(${frame.formX}px)`;
    registration.inert = frame.formX > 470;
    currentFrame = index;
  };

  const frameAt = time => {
    const introductionEnd = 4.45;
    const loopStart = 4.65;
    const loopEnd = 8.90;
    let position = time;
    if (position > loopEnd) position = loopStart + ((position - loopEnd) % (loopEnd - loopStart));
    if (time >= introductionEnd && position < loopStart) position = time;
    return Math.min(motion.count - 1, Math.floor(position * motion.fps));
  };

  const tick = now => {
    if (!active) return;
    if (previousTime !== null) elapsed += (now - previousTime) / 1000;
    previousTime = now;
    draw(frameAt(elapsed));
    requestId = requestAnimationFrame(tick);
  };

  const play = () => {
    if (!usable || active) return;
    active = true;
    previousTime = null;
    setPlaybackUI();
    requestId = requestAnimationFrame(tick);
  };

  const pause = () => {
    active = false;
    previousTime = null;
    cancelAnimationFrame(requestId);
    setPlaybackUI();
  };

  pauseButton.addEventListener('click', () => active ? pause() : play());
  replayButton.addEventListener('click', () => {
    if (!usable) return;
    pause();
    elapsed = 0;
    currentFrame = -1;
    draw(0);
    play();
  });

  document.addEventListener('visibilitychange', () => { previousTime = null; });
  reducedMotion.addEventListener('change', event => {
    if (event.matches && usable) {
      pause();
      draw(Math.floor(5 * motion.fps));
    }
  });

  const errorFor = input => {
    if (!input.value.trim()) return 'This field is required';
    if (input.value.trim().length < 2) return 'Please enter at least 2 characters';
    return '';
  };

  const validate = input => {
    const error = errorFor(input);
    document.getElementById(`${input.id}-field`).classList.toggle('invalid', Boolean(error));
    document.getElementById(`${input.id}-error`).textContent = error;
    input.setAttribute('aria-invalid', error ? 'true' : 'false');
    return !error;
  };

  [firstName, lastName].forEach(input => {
    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') validate(input);
    });
    input.addEventListener('focus', () => {
      // Keep the fields reachable immediately when navigating by keyboard.
      if (usable && elapsed < 4.45) {
        elapsed = 4.65;
        draw(frameAt(elapsed));
      }
    });
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    const validFirst = validate(firstName);
    const validLast = validate(lastName);
    if (!validFirst || !validLast) {
      status.textContent = 'Please complete both name fields.';
      (!validFirst ? firstName : lastName).focus();
      return;
    }
    status.textContent = '';
    document.getElementById('success-title').textContent = `Nice to meet you, ${firstName.value.trim()}.`;
    form.hidden = true;
    success.hidden = false;
    success.focus({ preventScroll: true });
  });

  document.getElementById('back-to-form').addEventListener('click', () => {
    success.hidden = true;
    form.hidden = false;
    firstName.focus();
  });
  document.getElementById('privacy-open').addEventListener('click', () => privacyDialog.showModal());
  document.getElementById('privacy-close').addEventListener('click', () => privacyDialog.close());
  privacyDialog.addEventListener('click', event => {
    if (event.target === privacyDialog) {
      const bounds = privacyDialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) privacyDialog.close();
    }
  });

  const loadImage = src => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load ${src}`));
    image.src = src;
  });

  const start = async () => {
    pauseButton.disabled = true;
    replayButton.disabled = true;
    try {
      const response = await fetch('assets/motion.json');
      if (!response.ok) throw new Error('Motion data unavailable');
      motion = await response.json();
      atlases = await Promise.all(Array.from({ length: motion.atlases }, (_, index) => loadImage(`assets/actor-${index}.webp`)));
      usable = true;
      pauseButton.disabled = false;
      replayButton.disabled = false;
      assetStatus.hidden = true;
      if (reducedMotion.matches) {
        draw(Math.floor(5 * motion.fps));
        setPlaybackUI();
      } else {
        draw(0);
        play();
      }
    } catch (error) {
      registration.style.transform = 'translateX(211px)';
      registration.inert = false;
      assetStatus.textContent = 'Animation unavailable. You can still use the form.';
      assetStatus.style.top = '80%';
      console.error(error);
    }
  };

  start();
})();
