# Voice Commands Troubleshooting Guide

## 🔍 Quick Debugging Steps

### 1. Check if Voice Commands are Working

1. **Open the app** in your browser (preferably Chrome)
2. **Look for the orange microphone button** at bottom-left of screen
3. **Open browser console** (F12 > Console tab)
4. **Click the voice command button** and say "open water"
5. **Check console logs** for debugging information

### 2. Test Basic Commands

Try these commands one by one and check console output:

**Navigation Commands:**
- "home" or "go home"
- "open water" or "water"
- "open electricity" or "electricity"
- "open gas" or "gas"

**Action Commands:**
- "go back" or "back"
- "help"
- "close"

### 3. Check Console Logs

Look for these log messages in console:

```
✅ Working correctly:
[VoiceCommand] Received text: open water
[matchCommand] Input: {text: "open water", currentLanguage: "en"}
[matchCommand] ✅ EXACT MATCH found: {command: "water", keyword: "water"}
[VoiceCommand] Processing command...
[executeCommand] Navigating to: /water
[VoiceCommand] Command executed successfully

❌ Not working:
[VoiceCommand] Received text: open water
[matchCommand] No command matched for text: open water
[VoiceCommand] Command not recognized
```

## 🛠️ Common Issues & Solutions

### Issue 1: Button Appears but No Sound Recognition

**Symptoms:**
- Button visible but no "Listening..." message appears
- No console logs when clicking

**Solutions:**
1. **Check microphone permissions:**
   - Click lock icon in address bar
   - Allow microphone access
   - Refresh page

2. **Try different browser:**
   - Chrome/Edge: Full support ✅
   - Safari: iOS 14.5+ ✅
   - Firefox: Limited support ⚠️

### Issue 2: Listens but No Command Recognition

**Symptoms:**
- Shows "Listening..." and "You said: [text]"
- Shows "Command not recognized"
- Console shows no matches

**Solutions:**
1. **Speak clearly and use exact keywords:**
   ```
   ✅ Good: "open water", "water", "electricity"
   ❌ Bad: "go to the water section please"
   ```

2. **Check language settings:**
   - Make sure app language matches your speech
   - Try speaking in English first

3. **Test simple commands first:**
   - "water" (short and clear)
   - "home" (simple navigation)
   - "help" (shows all commands)

### Issue 3: Recognizes but Doesn't Execute

**Symptoms:**
- Shows "You said: [correct text]"
- Shows success message
- But no actual navigation happens

**Solutions:**
1. **Check React Router setup:**
   - Make sure all routes exist in App.jsx
   - Check for route conflicts

2. **Check for JavaScript errors:**
   - Look for red errors in console
   - Fix any blocking errors first

## 🧪 Manual Testing Script

Run this in browser console to test command matching:

```javascript
// Test command matching directly
function testVoiceCommand(text) {
  console.log(`Testing: "${text}"`);

  // Import the functions (adjust path if needed)
  const { matchCommand, getCommandFeedback } = window;

  const result = matchCommand(text, 'en');

  if (result) {
    console.log(`✅ Matched: ${result.id} (${result.action})`);
    console.log(`📝 Feedback: ${getCommandFeedback(result, 'en')}`);
  } else {
    console.log(`❌ No match found`);
  }
}

// Test basic commands
testVoiceCommand('water');
testVoiceCommand('open electricity');
testVoiceCommand('home');
testVoiceCommand('help');
```

## 🎯 Step-by-Step Verification

### Step 1: Check Button Visibility
- [ ] Orange microphone button visible at bottom-left
- [ ] Help button (question mark) next to it
- [ ] Tooltip shows "Tap to give voice command"

### Step 2: Test Microphone Access
- [ ] Click voice command button
- [ ] Browser asks for microphone permission
- [ ] Button turns orange and shows "Listening..."
- [ ] Speaking shows interim text in feedback bubble

### Step 3: Test Command Recognition
- [ ] Say "water" clearly
- [ ] Should show "You said: water"
- [ ] Should show "Opening water services"
- [ ] Page should navigate to /water

### Step 4: Test Service Commands (on water page)
- [ ] Say "new connection"
- [ ] Should navigate to /water?service=new_connection
- [ ] Dialog should open automatically

### Step 5: Test Help System
- [ ] Say "help"
- [ ] Help dialog should open
- [ ] All commands should be listed

## 🔧 Advanced Debugging

### Enable Detailed Logging

Add this to browser console for more logs:

```javascript
// Override console.log to show timestamps
const originalLog = console.log;
console.log = function(...args) {
  originalLog(new Date().toLocaleTimeString(), ...args);
};

// Enable verbose voice command logging
window.VOICE_DEBUG = true;
```

### Check Command Definitions

Verify commands are loaded:

```javascript
// Check if commands are loaded
console.log('Total commands:', window.ALL_COMMANDS?.length || 'Not loaded');

// Check specific command exists
const waterCommands = window.ALL_COMMANDS?.filter(cmd =>
  cmd.keywords.en.includes('water')
);
console.log('Water commands:', waterCommands);
```

### Test Navigation Manually

Try navigation without voice:

```javascript
// Test React Router navigation
import { useNavigate } from 'react-router-dom';
// Or for testing:
window.location.href = '/water';
```

## 🎪 Demo Commands

Once working, try these impressive demos:

### English Commands
- "Open electricity department"
- "Pay water bill"
- "File a complaint"
- "New gas connection"
- "Go back home"

### Hindi Commands
- "बिजली खोलो"
- "पानी का बिल भरो"
- "शिकायत करो"
- "नया गैस कनेक्शन"

### Marathi Commands
- "वीज उघडा"
- "पाणी बिल भरा"
- "तक्रार करा"
- "नवीन गॅस कनेक्शन"

## 🆘 Getting Help

If issues persist:

1. **Check browser compatibility:**
   - Use Chrome or Edge for best results
   - Update to latest browser version

2. **Verify microphone works:**
   - Test with other voice apps
   - Check system audio settings

3. **Clear cache and reload:**
   - Hard refresh (Ctrl+F5)
   - Clear browser cache

4. **Check for conflicts:**
   - Disable browser extensions
   - Test in incognito mode

## 📱 Mobile Testing

For mobile devices:

1. **iOS Safari:**
   - Requires iOS 14.5+
   - Tap microphone button (don't hold)
   - Speak when you see "Listening..."

2. **Android Chrome:**
   - Should work on most modern devices
   - Ensure microphone permissions granted

Remember: Voice commands work best in quiet environments with clear speech! 🎤✨