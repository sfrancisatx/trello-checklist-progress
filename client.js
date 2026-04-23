/* global TrelloPowerUp */

var SHOW_BADGE_KEY = 'showChecklistBadge';
var DISPLAY_MODE_KEY = 'displayMode'; // 'fraction', 'percentage', 'both'

// Static fallback checklist icon (used in toggle button)
var CHECKLIST_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjNDI1MjZFIiBkPSJNMTAgMThoLTRhMSAxIDAgMCAxLTEtMVY3YTEgMSAwIDAgMSAxLTFoNGExIDEgMCAwIDEgMSAxdjEwYTEgMSAwIDAgMS0xIDF6bTYgMGgtNGExIDEgMCAwIDEtMS0xVjdhMSAxIDAgMCAxIDEtMWg0YTEgMSAwIDAgMSAxIDF2MTBhMSAxIDAgMCAxLTEgMXoiLz48L3N2Zz4=';

// Map Trello color names to hex values for progress bar fill
var COLOR_HEX = {
  'green':      '#61bd4f',
  'lime':       '#b3d445',
  'yellow':     '#f2d600',
  'orange':     '#ff9f1a',
  'red':        '#eb5a46',
  'light-gray': '#c4c9cc'
};

// Generate an SVG progress bar data URL for the given percentage + color
function progressBarIcon(percentage, colorName) {
  var fillColor = COLOR_HEX[colorName] || '#61bd4f';
  var bgColor = '#e0e0e0';
  var pct = Math.max(0, Math.min(100, percentage));
  // 48x16 viewBox - horizontal progress bar
  var svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 16">' +
      '<rect x="0" y="4" width="48" height="8" rx="2" fill="' + bgColor + '"/>' +
      '<rect x="0" y="4" width="' + (48 * pct / 100) + '" height="8" rx="2" fill="' + fillColor + '"/>' +
    '</svg>';
  return 'data:image/svg+xml;base64,' + btoa(svg);
}

// Calculate checklist statistics
function getChecklistStats(card) {
  var totalItems = 0;
  var completedItems = 0;
  var checklistDetails = [];

  if (card.checklists && card.checklists.length > 0) {
    card.checklists.forEach(function(checklist) {
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
  }

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

// Build a unicode progress bar string e.g. "███░░"
function progressBar(percentage, segments) {
  segments = segments || 5;
  var filled = Math.round((percentage / 100) * segments);
  return '█'.repeat(filled) + '░'.repeat(segments - filled);
}

// Format badge text based on display mode
function formatBadgeText(stats, displayMode) {
  if (stats.total === 0) return null;

  var bar = progressBar(stats.percentage);
  switch (displayMode) {
    case 'percentage':
      return bar + ' ' + stats.percentage + '%';
    case 'both':
      return bar + ' ' + stats.completed + '/' + stats.total + ' (' + stats.percentage + '%)';
    case 'fraction':
    default:
      return bar + ' ' + stats.completed + '/' + stats.total;
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

// Initialize the Power-Up
TrelloPowerUp.initialize({
  // Show checklist progress badge on card front
  'card-badges': function(t, options) {
    return Promise.all([
      t.card('checklists'),
      t.get('card', 'shared', SHOW_BADGE_KEY, true),
      t.get('board', 'shared', DISPLAY_MODE_KEY, 'fraction')
    ])
    .then(function(results) {
      var card = results[0];
      var showBadge = results[1];
      var displayMode = results[2];

      if (!showBadge) return [];

      var stats = getChecklistStats(card);
      
      if (stats.total === 0) return [];

      var badgeText = formatBadgeText(stats, displayMode);
      var color = getProgressColor(stats.percentage);
      var tooltip = buildTooltip(stats);

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
    });
  },

  // Add toggle button to show/hide badge
  'card-buttons': function(t, options) {
    return t.get('card', 'shared', SHOW_BADGE_KEY, true)
      .then(function(showBadge) {
        return [{
          icon: CHECKLIST_ICON,
          text: showBadge ? 'Hide Checklist Badge' : 'Show Checklist Badge',
          callback: function(t) {
            return t.set('card', 'shared', SHOW_BADGE_KEY, !showBadge)
              .then(function() {
                return t.closePopup();
              });
          }
        }];
      });
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
  }
});

console.log('Checklist Progress Power-Up loaded');
