# Voice Command System Documentation

## Overview

The Voice Command System (Speech-to-Action) extends the existing voice input functionality to allow users to control the kiosk application using natural voice commands in **English**, **Hindi**, and **Marathi**. This feature is designed for hands-free navigation and operation, making the system more accessible for users with disabilities.

## Features

### 1. **Multilingual Command Recognition**
- Supports English, Hindi, and Marathi
- Flexible keyword-based matching
- Handles variations and natural speech patterns

### 2. **Navigation Commands**
- Navigate between departments (Electricity, Water, Gas, Municipal)
- Return to home page
- Go back to previous screen

### 3. **Service Commands**
- Open specific services within departments
- Examples: "New connection", "Pay bill", "File complaint"
- Works across all departments

### 4. **UI Action Commands**
- Submit forms
- Close dialogs
- Scroll up/down
- Show help

## Components

### VoiceCommandButton
A floating button that listens for voice commands and executes corresponding actions.

**Location**: Bottom-left of the screen (configurable)

**Features**:
- Visual feedback during listening
- Success/error indicators
- Built-in help dialog
- Pulse animation when active

### useVoiceCommands Hook
Custom hook for processing and executing voice commands.

### useServiceAutoOpen Hook
Helper hook for service pages to auto-open dialogs based on voice commands.

## Available Voice Commands

### Navigation Commands

| Action | English | Hindi | Marathi |
|--------|---------|-------|---------|
| Home | "Go home", "Main page" | "होम", "मुख्य पेज" | "होम", "मुख्य पान" |
| Electricity | "Open electricity", "Power" | "बिजली खोलो", "बिजली विभाग" | "वीज उघडा", "वीज विभाग" |
| Water | "Open water", "Water department" | "पानी खोलो", "पानी विभाग" | "पाणी उघडा", "पाणी विभाग" |
| Gas | "Open gas", "LPG" | "गैस खोलो", "गैस विभाग" | "गॅस उघडा", "गॅस विभाग" |
| Municipal | "Open municipal", "Corporation" | "नगरपालिका खोलो" | "नगरपालिका उघडा" |

### Service Commands

#### Electricity Services
| Service | English | Hindi | Marathi |
|---------|---------|-------|---------|
| Billing | "Pay electricity bill", "Light bill" | "बिजली का बिल", "बिल भरो" | "वीज बिल", "बिल भरा" |
| New Connection | "New electricity connection" | "नया कनेक्शन" | "नवीन कनेक्शन" |
| Complaint | "Electricity complaint", "Power cut" | "बिजली शिकायत", "बिजली गायब" | "वीज तक्रार", "वीज गेली" |
| Track | "Track electricity", "Application status" | "ट्रैक करो", "स्थिति देखो" | "ट्रॅक करा", "स्थिती पहा" |

#### Water Services
| Service | English | Hindi | Marathi |
|---------|---------|-------|---------|
| Billing | "Pay water bill", "Water payment" | "पानी का बिल", "पानी बिल भरो" | "पाणी बिल", "पाणी बिल भरा" |
| New Connection | "New water connection" | "नया पानी कनेक्शन" | "नवीन पाणी कनेक्शन" |
| Complaint | "Water complaint", "No water" | "पानी शिकायत", "पानी नहीं" | "पाणी तक्रार", "पाणी नाही" |
| Tanker | "Water tanker", "Book tanker" | "पानी टैंकर", "टैंकर बुक करो" | "पाणी टँकर", "टँकर बुक करा" |

#### Gas Services
| Service | English | Hindi | Marathi |
|---------|---------|-------|---------|
| New Connection | "New gas connection", "LPG connection" | "नया गैस कनेक्शन" | "नवीन गॅस कनेक्शन" |
| Refill | "Gas refill", "Book cylinder" | "गैस रिफिल", "सिलेंडर बुक करो" | "गॅस रिफिल", "सिलेंडर बुक करा" |
| Complaint | "Gas complaint", "Gas leak" | "गैस शिकायत", "गैस लीक" | "गॅस तक्रार", "गॅस गळती" |

#### Municipal Services
| Service | English | Hindi | Marathi |
|---------|---------|-------|---------|
| Property Tax | "Property tax", "Pay tax" | "प्रॉपर्टी टैक्स", "टैक्स भरो" | "प्रॉपर्टी टॅक्स", "कर भरा" |
| Birth/Death | "Birth certificate", "Death certificate" | "जन्म प्रमाणपत्र", "मृत्यु प्रमाणपत्र" | "जन्म प्रमाणपत्र", "मृत्यू प्रमाणपत्र" |
| Trade License | "Trade license", "Business license" | "ट्रेड लाइसेंस", "व्यापार लाइसेंस" | "ट्रेड लायसन्स", "व्यापार परवाना" |
| Grievance | "Grievance", "Public complaint" | "शिकायत", "जन शिकायत" | "तक्रार", "जन तक्रार" |
| Sanitation | "Sanitation", "Garbage", "Cleaning" | "सफाई", "कचरा" | "स्वच्छता", "कचरा" |
| Roads | "Roads", "Pothole", "Street light" | "सड़क", "गड्ढा", "स्ट्रीट लाइट" | "रस्ता", "खड्डा", "स्ट्रीट लाइट" |

### UI Action Commands

| Action | English | Hindi | Marathi |
|--------|---------|-------|---------|
| Go Back | "Go back", "Previous" | "वापस", "पीछे" | "मागे", "परत" |
| Submit | "Submit", "Submit form" | "जमा करो", "सबमिट" | "सबमिट करा", "जमा करा" |
| Close | "Close", "Cancel" | "बंद करो", "कैंसल" | "बंद करा", "कॅन्सल" |
| Scroll Down | "Scroll down", "Go down" | "नीचे", "नीचे जाओ" | "खाली", "खाली जा" |
| Scroll Up | "Scroll up", "Go up" | "ऊपर", "ऊपर जाओ" | "वर", "वर जा" |
| Help | "Help", "Voice commands" | "मदद", "सहायता" | "मदत", "सहाय्य" |

## How It Works

### 1. User Interaction Flow

```
User taps Voice Command button
        ↓
System shows "Listening..." feedback
        ↓
User speaks command (e.g., "Open water")
        ↓
System recognizes speech and shows "You said: open water"
        ↓
System matches command and shows success feedback
        ↓
System executes action (navigates to water department)
```

### 2. Command Processing

1. **Speech Recognition**: Uses Web Speech API to convert speech to text
2. **Text Normalization**: Converts to lowercase and trims whitespace
3. **Command Matching**: Keyword-based matching across all languages
4. **Action Execution**: Executes navigation, service opening, or UI action
5. **Feedback**: Shows visual confirmation and result

### 3. Command Matching Algorithm

```javascript
1. Normalize input text (lowercase, trim)
2. Check all commands in priority languages (current language first)
3. For each command's keywords:
   - Exact match = 100 score (instant match)
   - Contains keyword = 90 score (weighted by length)
   - Keyword contains text = 70 score (partial match)
4. Return best match if score >= 40 (threshold)
5. Show "not recognized" if no match
```

## Integration Guide

### For Service Pages

To enable voice command support in a service page:

```jsx
import { useServiceAutoOpen } from '../../components/voice/useServiceAutoOpen';

function MyServicePage() {
  const [selectedService, setSelectedService] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Add this hook
  const { autoOpenServiceId, clearAutoOpen } = useServiceAutoOpen();

  // Add this effect
  useEffect(() => {
    if (autoOpenServiceId) {
      setSelectedService(autoOpenServiceId);
      setDialogOpen(true);
      clearAutoOpen();
    }
  }, [autoOpenServiceId, clearAutoOpen]);

  // Rest of your component...
}
```

**Required Changes**:
1. Import the `useServiceAutoOpen` hook
2. Call the hook to get `autoOpenServiceId` and `clearAutoOpen`
3. Add a `useEffect` to handle auto-opening

### Adding New Commands

To add new voice commands, edit `voiceCommands.js`:

```javascript
// Add to NAVIGATION_COMMANDS, SERVICE_COMMANDS, or UI_ACTION_COMMANDS
{
  id: 'my_new_command',
  action: 'navigate', // or 'openService', 'submit', etc.
  route: '/my-route', // for navigation
  keywords: {
    en: ['english keyword', 'english variant'],
    hi: ['हिंदी कीवर्ड'],
    mr: ['मराठी कीवर्ड'],
  },
  feedback: {
    en: 'English feedback message',
    hi: 'हिंदी फीडबैक संदेश',
    mr: 'मराठी फीडबॅक संदेश',
  },
}
```

## Technical Implementation

### Files Created

1. **voiceCommands.js** - Command definitions and matching logic
2. **useVoiceCommands.js** - Hook for command processing and execution
3. **VoiceCommandButton.jsx** - UI component for voice commands
4. **useServiceAutoOpen.js** - Helper hook for service pages

### Files Modified

1. **main.jsx** - Added VoiceCommandButton component
2. **pages/water/WaterServicesPage.jsx** - Added voice command support (example)
3. **components/voice/index.js** - Updated exports

### Dependencies

- React Router (for navigation)
- Material-UI (for UI components)
- Web Speech API (browser native)
- TranslationContext (for language detection)

## Browser Compatibility

The voice command system works on browsers that support the Web Speech API:

- ✅ Chrome/Edge (full support)
- ✅ Safari (iOS 14.5+)
- ⚠️ Firefox (limited support)
- ❌ Internet Explorer (not supported)

## Accessibility Features

1. **Visual Feedback**: Clear indicators for listening, processing, and results
2. **Error Handling**: Graceful handling of unrecognized commands
3. **Help System**: Built-in help dialog with all available commands
4. **Multilingual**: Full support for English, Hindi, and Marathi
5. **Hands-Free**: Completely operable without touching the screen
6. **Status Indicators**: Color-coded feedback (blue=info, green=success, red=error)

## User Guide

### How to Use Voice Commands

1. **Tap the Voice Command button** (orange button with microphone icon, bottom-left)
2. **Wait for "Listening..."** message to appear
3. **Speak your command clearly** in English, Hindi, or Marathi
4. **Wait for confirmation** - system will show what you said
5. **Action executes** - page navigates or service opens automatically

### Tips for Best Results

- Speak clearly and at normal pace
- Use the microphone in a quiet environment
- Wait for "Listening..." before speaking
- Use natural variations (e.g., "open water" or "water department")
- Check help (tap ? icon) for available commands
- If command not recognized, try rephrasing

### Troubleshooting

| Problem | Solution |
|---------|----------|
| Button not visible | Browser doesn't support Web Speech API |
| Always shows error | Check microphone permissions |
| Command not recognized | Try simpler keywords or check help |
| Service doesn't open | Page may not support voice commands yet |
| Poor recognition | Use quieter environment or speak clearer |

## Future Enhancements

Potential improvements for future versions:

1. **Offline Support**: Add offline speech recognition
2. **Custom Vocabulary**: Train model with government-specific terms
3. **More Languages**: Add regional languages (Gujarati, Tamil, etc.)
4. **Voice Confirmation**: System speaks back confirmations
5. **Continuous Listening**: Stay listening for multiple commands
6. **Context Awareness**: Smart suggestions based on current page
7. **Admin Panel**: Configure commands without code changes
8. **Analytics**: Track command usage and recognition accuracy

## Testing

### Manual Testing Checklist

- [ ] Voice command button appears and is functional
- [ ] Help dialog shows all commands
- [ ] Navigation commands work for all departments
- [ ] Service commands open correct dialogs
- [ ] UI actions (back, close, scroll) work
- [ ] All three languages are recognized
- [ ] Visual feedback is clear and timely
- [ ] Error handling works gracefully
- [ ] Microphone permissions requested correctly
- [ ] URL parameters cleared after auto-open

### Test Commands

Try these commands to verify functionality:

```
Navigation:
- "Open electricity"
- "बिजली खोलो"
- "वीज उघडा"
- "Go home"

Services:
- "Pay water bill"
- "New connection"
- "File complaint"
- "नया कनेक्शन"

Actions:
- "Go back"
- "Help"
- "Close"
```

## Support

For issues or questions:
- Check this documentation
- Review voice command help (? icon in app)
- Check browser console for errors
- Verify microphone permissions
- Test in supported browser (Chrome recommended)

---

**Version**: 1.0
**Last Updated**: 2026-03-18
**Maintained By**: Suvidha Development Team
