(function () {
  "use strict";

  var header = document.querySelector(".site-header");
  var navToggle = document.querySelector(".nav-toggle");
  var mobileNav = document.querySelector(".mobile-nav");
  var faqButtons = document.querySelectorAll(".faq-item__question");
  var revealItems = document.querySelectorAll(".reveal");

  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  }

  if (navToggle && mobileNav) {
    navToggle.addEventListener("click", function () {
      var isOpen = mobileNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      mobileNav.setAttribute("aria-hidden", isOpen ? "false" : "true");
    });

    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mobileNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        mobileNav.setAttribute("aria-hidden", "true");
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

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();
