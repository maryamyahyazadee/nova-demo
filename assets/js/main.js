(function () {
  "use strict";

  var header = document.querySelector(".site-header");
  var navToggle = document.querySelector(".nav-toggle");
  var mobileNav = document.querySelector(".mobile-nav");
  var navBackdrop = document.querySelector(".nav-backdrop");
  var faqButtons = document.querySelectorAll(".faq-item__question");
  var revealItems = document.querySelectorAll(".reveal");
  var testimonialSliders = document.querySelectorAll("[data-testimonials-slider]");
  var voiceCards = document.querySelectorAll("[data-voice-card]");

  function toPersianDigits(value) {
    return String(value).replace(/\d/g, function (digit) {
      return "۰۱۲۳۴۵۶۷۸۹"[digit];
    });
  }

  function formatVoiceTime(totalSeconds) {
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = Math.max(0, Math.floor(totalSeconds % 60));
    return toPersianDigits(minutes + ":" + String(seconds).padStart(2, "0"));
  }

  function setMobileNavOpen(isOpen) {
    if (!navToggle || !mobileNav) return;

    mobileNav.classList.toggle("is-open", isOpen);
    navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    navToggle.setAttribute("aria-label", isOpen ? "بستن منو" : "باز کردن منو");
    mobileNav.setAttribute("aria-hidden", isOpen ? "false" : "true");
    document.body.classList.toggle("nav-open", isOpen);

    if (navBackdrop) {
      navBackdrop.classList.toggle("is-visible", isOpen);
      navBackdrop.setAttribute("aria-hidden", isOpen ? "false" : "true");
    }
  }

  function onScroll() {
    if (header) {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
    }

    var floatCall = document.querySelector("[data-float-call]");
    if (!floatCall) return;

    var show = window.scrollY > 280;
    var footer = document.querySelector(".site-footer");

    if (show && footer) {
      var footerTop = footer.getBoundingClientRect().top;
      if (footerTop < window.innerHeight - 24) {
        show = false;
      }
    }

    floatCall.classList.toggle("is-visible", show);
    floatCall.setAttribute("aria-hidden", show ? "false" : "true");

    floatCall.querySelectorAll("a, button").forEach(function (el) {
      el.tabIndex = show ? 0 : -1;
    });
  }

  if (navToggle && mobileNav) {
    navToggle.addEventListener("click", function () {
      setMobileNavOpen(!mobileNav.classList.contains("is-open"));
    });

    if (navBackdrop) {
      navBackdrop.addEventListener("click", function () {
        setMobileNavOpen(false);
      });
    }

    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setMobileNavOpen(false);
      });
    });
  }

  faqButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      var item = button.closest(".faq-item");
      if (!item) return;

      var isOpen = item.classList.contains("is-open");
      var parent = item.parentElement;

      if (parent) {
        parent.querySelectorAll(".faq-item.is-open").forEach(function (openItem) {
          openItem.classList.remove("is-open");
          var openBtn = openItem.querySelector(".faq-item__question");
          if (openBtn) openBtn.setAttribute("aria-expanded", "false");
        });
      }

      if (!isOpen) {
        item.classList.add("is-open");
        button.setAttribute("aria-expanded", "true");
      }
    });
  });

  testimonialSliders.forEach(function (slider) {
    var viewport = slider.querySelector(".testimonials-slider__viewport");
    var slides = Array.from(slider.querySelectorAll(".testimonial-slide"));
    var prevButton = slider.querySelector("[data-testimonials-prev]");
    var nextButton = slider.querySelector("[data-testimonials-next]");
    var counter = slider.querySelector("[data-testimonials-counter]");
    var activeIndex = 0;
    var ticking = false;

    if (!viewport || !slides.length || !prevButton || !nextButton) return;

    function toPersianNumber(number) {
      return toPersianDigits(number);
    }

    function isFullyVisible(slide, viewportRect) {
      var rect = slide.getBoundingClientRect();
      return rect.left >= viewportRect.left - 1 && rect.right <= viewportRect.right + 1;
    }

    function updateSliderState() {
      var viewportRect = viewport.getBoundingClientRect();
      var nearestDistance = Infinity;

      slides.forEach(function (slide, index) {
        var distance = Math.abs(slide.getBoundingClientRect().right - viewportRect.right);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          activeIndex = index;
        }
      });

      prevButton.disabled = isFullyVisible(slides[0], viewportRect);
      nextButton.disabled = isFullyVisible(slides[slides.length - 1], viewportRect);

      if (counter) {
        counter.textContent =
          toPersianNumber(activeIndex + 1) + " / " + toPersianNumber(slides.length);
      }
    }

    function goToSlide(index) {
      activeIndex = Math.max(0, Math.min(index, slides.length - 1));
      slides[activeIndex].scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "nearest",
        inline: "start"
      });
    }

    prevButton.addEventListener("click", function () {
      goToSlide(activeIndex - 1);
    });

    nextButton.addEventListener("click", function () {
      goToSlide(activeIndex + 1);
    });

    viewport.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(function () {
          updateSliderState();
          ticking = false;
        });
      },
      { passive: true }
    );

    viewport.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToSlide(activeIndex + 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goToSlide(activeIndex - 1);
      }
    });

    window.addEventListener("resize", updateSliderState);
    updateSliderState();
  });

  (function initVoicePlayers() {
    if (!voiceCards.length) return;

    var activeCard = null;
    var rafId = null;
    var startedAt = 0;
    var elapsedBeforePause = 0;
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function getCardParts(card) {
      return {
        playButton: card.querySelector("[data-voice-play]"),
        progress: card.querySelector("[data-voice-progress]"),
        current: card.querySelector("[data-voice-current]"),
        duration: Number(card.getAttribute("data-duration")) || 45
      };
    }

    function resetCard(card) {
      var parts = getCardParts(card);
      card.classList.remove("is-playing");
      if (parts.playButton) {
        parts.playButton.setAttribute("aria-pressed", "false");
      }
      if (parts.progress) {
        parts.progress.style.width = "0%";
      }
      if (parts.current) {
        parts.current.textContent = formatVoiceTime(parts.duration);
      }
    }

    function stopActive() {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (activeCard) {
        resetCard(activeCard);
        activeCard = null;
      }
      elapsedBeforePause = 0;
      startedAt = 0;
    }

    function tick() {
      if (!activeCard) return;

      var parts = getCardParts(activeCard);
      var elapsed = elapsedBeforePause + (performance.now() - startedAt) / 1000;
      var progress = Math.min(elapsed / parts.duration, 1);

      if (parts.progress) {
        parts.progress.style.width = progress * 100 + "%";
      }
      if (parts.current) {
        parts.current.textContent = formatVoiceTime(elapsed);
      }

      if (progress >= 1) {
        stopActive();
        return;
      }

      rafId = window.requestAnimationFrame(tick);
    }

    function playCard(card) {
      var parts = getCardParts(card);

      if (activeCard && activeCard !== card) {
        stopActive();
      }

      if (activeCard === card) {
        elapsedBeforePause += (performance.now() - startedAt) / 1000;
        if (rafId) {
          window.cancelAnimationFrame(rafId);
          rafId = null;
        }
        card.classList.remove("is-playing");
        if (parts.playButton) {
          parts.playButton.setAttribute("aria-pressed", "false");
        }
        activeCard = null;
        return;
      }

      activeCard = card;
      card.classList.add("is-playing");
      if (parts.playButton) {
        parts.playButton.setAttribute("aria-pressed", "true");
      }

      if (reduceMotion) {
        if (parts.progress) {
          parts.progress.style.width = "100%";
        }
        if (parts.current) {
          parts.current.textContent = formatVoiceTime(parts.duration);
        }
        window.setTimeout(stopActive, 450);
        return;
      }

      startedAt = performance.now();
      rafId = window.requestAnimationFrame(tick);
    }

    voiceCards.forEach(function (card) {
      var parts = getCardParts(card);
      resetCard(card);

      if (!parts.playButton) return;

      parts.playButton.addEventListener("click", function () {
        playCard(card);
      });
    });
  })();

  if ("IntersectionObserver" in window && revealItems.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    revealItems.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    revealItems.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  var doctorPicker = document.querySelector(".doctor-picker");
  if (doctorPicker) {
    var doctorTabs = doctorPicker.querySelectorAll("[data-doctor-tab]");
    var doctorPanels = document.querySelectorAll("[data-doctor-panel]");

    function activateDoctor(id) {
      doctorTabs.forEach(function (tab) {
        var isActive = tab.getAttribute("data-doctor-tab") === id;
        tab.classList.toggle("is-active", isActive);
        tab.setAttribute("aria-selected", isActive ? "true" : "false");
        tab.tabIndex = isActive ? 0 : -1;
      });

      doctorPanels.forEach(function (panel) {
        var isActive = panel.getAttribute("data-doctor-panel") === id;
        panel.classList.toggle("is-active", isActive);
        panel.setAttribute("aria-hidden", isActive ? "false" : "true");
        if (isActive) {
          panel.removeAttribute("inert");
        } else {
          panel.setAttribute("inert", "");
        }
      });
    }

    doctorTabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        activateDoctor(tab.getAttribute("data-doctor-tab"));
      });

      tab.addEventListener("keydown", function (event) {
        var tabs = Array.prototype.slice.call(doctorTabs);
        var index = tabs.indexOf(tab);
        var nextIndex = index;

        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          if (event.key === "ArrowLeft") {
            nextIndex = (index + 1) % tabs.length;
          } else {
            nextIndex = (index - 1 + tabs.length) % tabs.length;
          }
          tabs[nextIndex].focus();
          activateDoctor(tabs[nextIndex].getAttribute("data-doctor-tab"));
        }
      });
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  (function initHeroVideo() {
    var media = document.querySelector("[data-hero-video]");
    if (!media) return;

    var video = media.querySelector(".hero-media__video");
    var playButton = media.querySelector("[data-hero-video-play]");
    if (!video || !playButton) return;

    var hasStarted = false;

    function setPlaying(isPlaying) {
      media.classList.toggle("is-playing", isPlaying);
      playButton.setAttribute("aria-hidden", isPlaying ? "true" : "false");
      playButton.tabIndex = isPlaying ? -1 : 0;
    }

    function enableControls() {
      video.setAttribute("controls", "");
    }

    function resetToIdle() {
      hasStarted = false;
      setPlaying(false);
      video.removeAttribute("controls");
      video.currentTime = 0;
    }

    function playVideo() {
      var playPromise = video.play();
      if (playPromise && typeof playPromise.then === "function") {
        playPromise
          .then(function () {
            hasStarted = true;
            setPlaying(true);
            enableControls();
          })
          .catch(function () {
            setPlaying(false);
          });
      } else {
        hasStarted = true;
        setPlaying(true);
        enableControls();
      }
    }

    playButton.addEventListener("click", function () {
      playVideo();
    });

    video.addEventListener("play", function () {
      hasStarted = true;
      setPlaying(true);
      enableControls();
    });

    video.addEventListener("pause", function () {
      if (video.ended) return;
      // Keep overlay hidden and controls visible so seeking stays usable.
      if (hasStarted) {
        setPlaying(true);
        enableControls();
      }
    });

    video.addEventListener("ended", function () {
      resetToIdle();
    });
  })();

  (function initBookingModal() {
    var modal = document.getElementById("booking-modal");
    if (!modal) return;

    var dialog = modal.querySelector("[data-booking-dialog]");
    var openButtons = document.querySelectorAll("[data-booking-open]");
    var closeButtons = modal.querySelectorAll("[data-booking-close]");
    var form = modal.querySelector("[data-booking-form]");
    var success = modal.querySelector("[data-booking-success]");
    var selectRoot = modal.querySelector("[data-booking-select]");
    var lastFocus = null;

    function getSelectParts() {
      if (!selectRoot) return null;
      return {
        input: selectRoot.querySelector("#booking-service"),
        trigger: selectRoot.querySelector("[data-booking-select-trigger]"),
        valueLabel: selectRoot.querySelector("[data-booking-select-value]"),
        menu: selectRoot.querySelector("[data-booking-select-menu]"),
        options: Array.from(selectRoot.querySelectorAll('[role="option"]'))
      };
    }

    function closeSelect() {
      var parts = getSelectParts();
      if (!parts || !parts.menu || !parts.trigger) return;
      selectRoot.classList.remove("is-open");
      parts.menu.hidden = true;
      parts.trigger.setAttribute("aria-expanded", "false");
      parts.options.forEach(function (option) {
        option.classList.remove("is-active");
      });
    }

    function openSelect() {
      var parts = getSelectParts();
      if (!parts || !parts.menu || !parts.trigger) return;
      selectRoot.classList.add("is-open");
      parts.menu.hidden = false;
      parts.trigger.setAttribute("aria-expanded", "true");
      var selected = parts.options.find(function (option) {
        return option.classList.contains("is-selected");
      });
      if (selected) {
        selected.classList.add("is-active");
        selected.focus();
      }
    }

    function setSelectValue(value, label) {
      var parts = getSelectParts();
      if (!parts) return;

      if (parts.input) parts.input.value = value;
      if (parts.valueLabel) parts.valueLabel.textContent = label;

      parts.options.forEach(function (option) {
        var isSelected = option.getAttribute("data-value") === value;
        option.classList.toggle("is-selected", isSelected);
        option.setAttribute("aria-selected", isSelected ? "true" : "false");
      });
    }

    function resetSelect() {
      var parts = getSelectParts();
      if (!parts) return;
      var defaultOption =
        parts.options.find(function (option) {
          return option.getAttribute("data-value") === "thyroid";
        }) || parts.options[0];

      if (!defaultOption) return;
      setSelectValue(defaultOption.getAttribute("data-value"), defaultOption.textContent.trim());
      closeSelect();
    }

    function getFocusable() {
      return Array.from(
        dialog.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter(function (el) {
        return !el.hasAttribute("hidden") && el.offsetParent !== null;
      });
    }

    function openModal() {
      lastFocus = document.activeElement;
      setMobileNavOpen(false);
      closeSelect();
      modal.hidden = false;
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("booking-open");

      if (form) form.hidden = false;
      if (success) success.hidden = true;

      window.setTimeout(function () {
        var firstInput = modal.querySelector("#booking-name");
        if (firstInput) firstInput.focus();
      }, 20);
    }

    function closeModal() {
      closeSelect();
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("booking-open");

      if (form) {
        form.hidden = false;
        form.reset();
        resetSelect();
        form.querySelectorAll(".booking-form__field.is-invalid").forEach(function (field) {
          field.classList.remove("is-invalid");
        });
        form.querySelectorAll(".booking-form__error").forEach(function (error) {
          error.hidden = true;
        });
      }
      if (success) success.hidden = true;

      if (lastFocus && typeof lastFocus.focus === "function") {
        lastFocus.focus();
      }
    }

    function isValidPhone(value) {
      var digits = String(value).replace(/[^\d]/g, "");
      return digits.length >= 10 && digits.length <= 12;
    }

    openButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        openModal();
      });
    });

    closeButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        closeModal();
      });
    });

    if (selectRoot) {
      var parts = getSelectParts();

      parts.trigger.addEventListener("click", function () {
        if (selectRoot.classList.contains("is-open")) {
          closeSelect();
          parts.trigger.focus();
        } else {
          openSelect();
        }
      });

      parts.options.forEach(function (option, index) {
        option.addEventListener("click", function () {
          setSelectValue(option.getAttribute("data-value"), option.textContent.trim());
          closeSelect();
          parts.trigger.focus();
        });

        option.addEventListener("keydown", function (event) {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            var next = parts.options[Math.min(index + 1, parts.options.length - 1)];
            parts.options.forEach(function (item) {
              item.classList.remove("is-active");
            });
            next.classList.add("is-active");
            next.focus();
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            var prev = parts.options[Math.max(index - 1, 0)];
            parts.options.forEach(function (item) {
              item.classList.remove("is-active");
            });
            prev.classList.add("is-active");
            prev.focus();
          } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setSelectValue(option.getAttribute("data-value"), option.textContent.trim());
            closeSelect();
            parts.trigger.focus();
          } else if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            closeSelect();
            parts.trigger.focus();
          }
        });
      });

      document.addEventListener("click", function (event) {
        if (!selectRoot.classList.contains("is-open")) return;
        if (!selectRoot.contains(event.target)) {
          closeSelect();
        }
      });
    }

    document.addEventListener("keydown", function (event) {
      if (modal.hidden) return;

      if (event.key === "Escape") {
        if (selectRoot && selectRoot.classList.contains("is-open")) {
          event.preventDefault();
          closeSelect();
          var selectParts = getSelectParts();
          if (selectParts && selectParts.trigger) selectParts.trigger.focus();
          return;
        }
        event.preventDefault();
        closeModal();
        return;
      }

      if (event.key !== "Tab") return;

      var focusable = getFocusable();
      if (!focusable.length) return;

      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();

        var nameInput = form.querySelector("#booking-name");
        var phoneInput = form.querySelector("#booking-phone");
        var nameField = nameInput ? nameInput.closest(".booking-form__field") : null;
        var phoneField = phoneInput ? phoneInput.closest(".booking-form__field") : null;
        var nameError = form.querySelector('[data-error-for="name"]');
        var phoneError = form.querySelector('[data-error-for="phone"]');
        var isValid = true;

        if (nameField) nameField.classList.remove("is-invalid");
        if (phoneField) phoneField.classList.remove("is-invalid");
        if (nameError) nameError.hidden = true;
        if (phoneError) phoneError.hidden = true;

        if (!nameInput || !String(nameInput.value).trim()) {
          isValid = false;
          if (nameField) nameField.classList.add("is-invalid");
          if (nameError) nameError.hidden = false;
        }

        if (!phoneInput || !isValidPhone(phoneInput.value)) {
          isValid = false;
          if (phoneField) phoneField.classList.add("is-invalid");
          if (phoneError) phoneError.hidden = false;
        }

        if (!isValid) {
          var firstInvalid = form.querySelector(".booking-form__field.is-invalid input");
          if (firstInvalid) firstInvalid.focus();
          return;
        }

        form.hidden = true;
        if (success) {
          success.hidden = false;
          var closeBtn = success.querySelector("[data-booking-close]");
          if (closeBtn) closeBtn.focus();
        }
      });
    }
  })();
})();
