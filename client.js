/* global TrelloPowerUp */

var SHOW_BADGE_KEY = 'showChecklistBadge';
var DISPLAY_MODE_KEY = 'displayMode'; // 'fraction', 'percentage', 'both'
var APP_KEY = 'd700a75532f7a75fa31df0f8b9433749';
var APP_NAME = 'Checklist Progress';

// Checklist icon as data URL
var CHECKLIST_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjNDI1MjZFIiBkPSJNMTAgMThoLTRhMSAxIDAgMCAxLTEtMVY3YTEgMSAwIDAgMSAxLTFoNGExIDEgMCAwIDEgMSAxdjEwYTEgMSAwIDAgMS0xIDF6bTYgMGgtNGExIDEgMCAwIDEtMS0xVjdhMSAxIDAgMCAxIDEtMWg0YTEgMSAwIDAgMSAxIDF2MTBhMSAxIDAgMCAxLTEgMXoiLz48L3N2Zz4=';

// Fetch checklists for a card via REST API (authoritative data)
// Returns promise resolving to array of { name, checkItems: [...] }
function fetchChecklistsREST(cardId, token, apiKey) {
  var url = 'https://api.trello.com/1/cards/' + cardId +
    '/checklists?checkItems=all&fields=name&key=' + apiKey + '&token=' + token;
  return fetch(url).then(function(res) {
    if (!res.ok) throw new Error('REST fetch failed: ' + res.status);
    return res.json();
  });
}

// Calculate checklist statistics from an array of checklists (SDK or REST shape)
function getChecklistStats(checklists) {
  var totalItems = 0;
  var completedItems = 0;
  var checklistDetails = [];

  (checklists || []).forEach(function(checklist) {
    var items = checklist.checkItems || [];
    var checklistTotal = items.length;
    var checklistComplete = items.filter(function(item) {
      return item.state === 'complete';
    }).length;

    totalItems += checklistTotal;
    completedItems += checklistComplete;

    checklistDetails.push({
      name: checklist.name,
      total: checklistTotal,
      complete: checklistComplete,
      percentage: checklistTotal > 0 ? Math.round((checklistComplete / checklistTotal) * 100) : 0
    });
  });

  var percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return {
    total: totalItems,
    completed: completedItems,
    percentage: percentage,
    checklists: checklistDetails
  };
}

// Get color based on completion percentage
function getProgressColor(percentage) {
  if (percentage === 100) return 'green';
  if (percentage >= 75) return 'lime';
  if (percentage >= 50) return 'yellow';
  if (percentage >= 25) return 'orange';
  if (percentage > 0) return 'red';
  return 'light-gray';
}

// Format badge text based on display mode
function formatBadgeText(stats, displayMode) {
  if (stats.total === 0) return null;

  switch (displayMode) {
    case 'percentage':
      return stats.percentage + '%';
    case 'both':
      return stats.completed + '/' + stats.total + ' (' + stats.percentage + '%)';
    case 'fraction':
    default:
      return stats.completed + '/' + stats.total;
  }
}

// Build tooltip text
function buildTooltip(stats) {
  if (stats.checklists.length === 0) return 'No checklists';

  var lines = ['Checklist Progress:'];
  stats.checklists.forEach(function(checklist) {
    lines.push(checklist.name + ': ' + checklist.complete + '/' + checklist.total + ' (' + checklist.percentage + '%)');
  });

  return lines.join('\n');
}

// Resolve authoritative checklist stats for a card: prefer REST when authorized, else SDK
function resolveStats(t) {
  return Promise.all([
    t.card('id', 'checklists'),
    t.getRestApi().isAuthorized().catch(function() { return false; })
  ]).then(function(results) {
    var card = results[0];
    var isAuthorized = results[1];

    if (!isAuthorized) {
      // Fall back to SDK data (may undercount)
      return { stats: getChecklistStats(card.checklists), authorized: false };
    }

    return t.getRestApi().getToken().then(function(token) {
      return fetchChecklistsREST(card.id, token, APP_KEY)
        .then(function(checklists) {
          return { stats: getChecklistStats(checklists), authorized: true };
        })
        .catch(function(err) {
          console.error('REST fetch failed, falling back to SDK:', err);
          return { stats: getChecklistStats(card.checklists), authorized: false };
        });
    });
  });
}

// Initialize the Power-Up
TrelloPowerUp.initialize({
  // Show checklist progress badge on card front
  'card-badges': function(t, options) {
    return Promise.all([
      resolveStats(t),
      t.get('card', 'shared', SHOW_BADGE_KEY, true),
      t.get('board', 'shared', DISPLAY_MODE_KEY, 'fraction')
    ])
    .then(function(results) {
      var stats = results[0].stats;
      var showBadge = results[1];
      var displayMode = results[2];

      if (!showBadge) return [];
      if (stats.total === 0) return [];

      var badgeText = formatBadgeText(stats, displayMode);
      var color = getProgressColor(stats.percentage);

      return [{
        text: badgeText,
        icon: CHECKLIST_ICON,
        color: color,
        callback: function(t) {
          return t.popup({
            title: 'Checklist Details',
            url: './checklist-popup.html',
            height: 400
          });
        }
      }];
    })
    .catch(function(err) {
      console.error('card-badges failed:', err);
      return [];
    });
  },

  // Add toggle + authorize buttons
  'card-buttons': function(t, options) {
    return Promise.all([
      t.get('card', 'shared', SHOW_BADGE_KEY, true),
      t.getRestApi().isAuthorized().catch(function() { return false; })
    ]).then(function(results) {
      var showBadge = results[0];
      var isAuthorized = results[1];
      var buttons = [{
        icon: CHECKLIST_ICON,
        text: showBadge ? 'Hide Checklist Badge' : 'Show Checklist Badge',
        callback: function(t) {
          return t.set('card', 'shared', SHOW_BADGE_KEY, !showBadge)
            .then(function() { return t.closePopup(); });
        }
      }];
      if (!isAuthorized) {
        buttons.push({
          text: '🔑 Authorize Checklist Progress',
          callback: function(t) {
            return t.popup({
              title: 'Authorize Checklist Progress',
              url: './authorize.html',
              height: 160
            });
          }
        });
      }
      return buttons;
    }).catch(function() { return []; });
  },

  // Show detailed progress in card back section
  'card-back-section': function(t, options) {
    return {
      title: 'Checklist Progress',
      icon: CHECKLIST_ICON,
      content: {
        type: 'iframe',
        url: t.signUrl('./card-back-section.html'),
        height: 120
      }
    };
  },

  // Settings page
  'show-settings': function(t, options) {
    return t.popup({
      title: 'Checklist Progress Settings',
      url: './settings.html',
      height: 250
    });
  },

  // Authorization status for Trello's UI
  'authorization-status': function(t, options) {
    return t.getRestApi().isAuthorized()
      .then(function(isAuthorized) {
        return { authorized: isAuthorized };
      });
  },

  // Shown when user clicks "Authorize Account" in the Power-Up menu
  'show-authorization': function(t, options) {
    return t.popup({
      title: 'Authorize Checklist Progress',
      url: './authorize.html',
      height: 160
    });
  }
}, {
  appKey: APP_KEY,
  appName: APP_NAME
});

console.log('Checklist Progress Power-Up loaded');
