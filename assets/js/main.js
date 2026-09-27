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
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
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
})();
