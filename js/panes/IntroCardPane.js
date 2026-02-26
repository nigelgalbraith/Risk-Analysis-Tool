(function () {
  "use strict";

  /**
   * Renders the full set of intro cards into a single host element.
   *
   * Data source:
   *   - window.introCards (loaded from text/introCard.js)
   *
   * Markup contract:
   *   - Host element has data-pane="intro-cards"
   *   - Host element is the grid container (CSS class already on it)
   */
  function init(container) {
    var cards = window.introCards;

    if (!cards) {
      container.innerHTML = "<p>introCards data not loaded.</p>";
      return { destroy: function () {} };
    }

    var keys = Object.keys(cards);

    if (!keys.length) {
      container.innerHTML = "<p>No cards configured.</p>";
      return { destroy: function () {} };
    }

    container.innerHTML = keys.map(function (key) {
      var card = cards[key];
      if (!card) return "";
      var title = card.title || key;
      var desc = card.description || "";
      var link = card.link || "#";
      return (
        '<div class="risk-card">' +
          '<a href="' + link + '">' +
            "<h2>" + title + "</h2>" +
            "<p>" + desc + "</p>" +
          "</a>" +
        "</div>"
      );
    }).join("");

    return { destroy: function () {} };
  }

  if (!window.Panes || !window.Panes.register) {
    throw new Error("IntroCardsPane requires PanesCore.");
  }

  window.Panes.register("intro-cards", function (container) {
    return init(container);
  });
})();