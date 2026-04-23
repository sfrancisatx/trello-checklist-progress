# Checklist Progress Power-Up

A Trello Power-Up that displays checklist completion progress on card fronts with color-coded badges, detailed tooltips, and interactive popups.

## Features

- **📊 Card Front Badge** - Shows completion progress (e.g., "3/5" or "60%")
- **🎨 Color-Coded** - Green (100%), Lime (75%+), Yellow (50%+), Orange (25%+), Red (<25%)
- **💬 Hover Tooltips** - Shows breakdown by checklist name
- **🔍 Click for Details** - Opens popup with full progress breakdown and visual progress bars
- **📋 Card Back Section** - Shows progress summary when card is opened
- **⚙️ Toggle per Card** - Show/hide badge on individual cards
- **🎛️ Display Modes** - Choose between fraction, percentage, or both
- **📈 Progress Bars** - Visual representation of completion in popups

## Installation

### For Development/Testing

1. Start a local web server in this directory:
   ```bash
   cd trello-powerups/checklist-progress
   python3 -m http.server 8080
   ```

2. In Trello, go to your board and click "Power-Ups"

3. Click "Custom Power-Ups" (you may need to enable this in your Trello settings)

4. Click "New Power-Up"

5. Enter the manifest URL:
   ```
   http://localhost:8080/manifest.json
   ```

6. Enable the Power-Up on your board

### For Production

See [DEPLOY.md](../pin-cards/DEPLOY.md) for production deployment options (GitHub Pages, Netlify, etc.)

## Usage

### View Progress on Card Front

Once enabled, cards with checklists will automatically show a badge with completion progress:
- **Green badge**: 100% complete
- **Yellow badge**: 50-99% complete  
- **Red badge**: 0-49% complete

### Hover for Details

Hover over the badge to see a tooltip with breakdown by checklist:
```
Checklist Progress:
Design Tasks: 3/5 (60%)
Development: 2/2 (100%)
Testing: 0/3 (0%)
```

### Click for Full Details

Click the badge to open a detailed popup showing:
- Overall progress with visual progress bar
- Individual checklist progress with bars
- Percentage completion for each

### Toggle Badge Visibility

To hide the badge on a specific card:
1. Open the card
2. Click "Hide Checklist Badge" in the card buttons section
3. The badge will be hidden (click "Show Checklist Badge" to restore)

### Configure Display Format

To change how the badge displays progress:
1. Click the Power-Up settings (gear icon in Power-Ups menu)
2. Choose display format:
   - **Fraction**: `3/5`
   - **Percentage**: `60%`
   - **Both**: `3/5 (60%)`

### View in Card Back

When you open a card, the "Checklist Progress" section shows:
- Overall completion summary
- Progress bar
- Breakdown by checklist (if multiple)

## Display Modes

### Fraction (Default)
- Shows as: `3/5`
- Best for: Quick visual reference

### Percentage
- Shows as: `60%`
- Best for: Understanding completion level

### Both
- Shows as: `3/5 (60%)`
- Best for: Maximum information (may be long)

## Color Coding

The badge color indicates completion level:

| Percentage | Color | Meaning |
|------------|-------|---------|
| 100% | 🟢 Green | Complete |
| 75-99% | 🟡 Lime | Almost done |
| 50-74% | 🟡 Yellow | In progress |
| 25-49% | 🟠 Orange | Started |
| 1-24% | 🔴 Red | Just started |
| 0% | ⚪ Gray | Not started |

## How It Works

The Power-Up:
1. Reads checklist data from each card
2. Calculates total items and completed items
3. Displays as a badge on the card front
4. Updates automatically when checklist items are checked/unchecked
5. Stores display preferences per board and visibility per card

## Files

- `manifest.json` - Power-Up configuration
- `index.html` - Main entry point
- `client.js` - Core Power-Up logic
- `checklist-popup.html` - Detailed progress popup
- `card-back-section.html` - Progress summary in card back
- `settings.html` - Display format settings

## Limitations

- Only shows progress for cards that have checklists
- Badge text length is limited by Trello (very long text may be truncated)
- Progress updates when page refreshes or card is opened/closed

## Tips

- Use **Fraction mode** for compact display
- Use **Percentage mode** to quickly see completion level
- **Hide badges** on template cards or reference cards
- Click badges for detailed breakdown instead of opening the full card
- The card back section provides a quick overview when reviewing cards

## Troubleshooting

**Badge not showing:**
- Check that the card has at least one checklist
- Verify the badge hasn't been hidden (check card buttons)
- Refresh the page

**Wrong percentage:**
- Trello may cache data briefly
- Open the card to force a refresh
- Check that checklist items are properly marked complete/incomplete

**Settings not applying:**
- Settings are board-wide
- Refresh the page after changing settings
- Individual card visibility is separate from display format
