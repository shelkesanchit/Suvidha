# Voice Command Implementation Guide for Developers

## Quick Start: Adding Voice Command Support to Service Pages

This guide shows how to enable voice command support in Electricity, Gas, and Municipal service pages (similar to what's already done in Water services).

## Implementation Steps

### Step 1: Import the Hook

In your service page (e.g., `ElectricityServicesPage.jsx`):

```jsx
// Add to imports
import { useEffect } from 'react'; // if not already imported
import { useServiceAutoOpen } from '../../components/voice/useServiceAutoOpen';
```

### Step 2: Use the Hook

Inside your component function:

```jsx
function ElectricityServicesPage() {
  const [selectedService, setSelectedService] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Add this line - voice command support
  const { autoOpenServiceId, clearAutoOpen } = useServiceAutoOpen();

  // Rest of your code...
}
```

### Step 3: Add Auto-Open Effect

Add this useEffect to handle voice command navigation:

```jsx
// Handle auto-opening service via voice command
useEffect(() => {
  if (autoOpenServiceId) {
    // Verify the service ID is valid (check against your services array)
    const validService = electricityServices.find(s => s.id === autoOpenServiceId);
    if (validService) {
      setSelectedService(autoOpenServiceId);
      setDialogOpen(true);
    }
    clearAutoOpen();
  }
}, [autoOpenServiceId, clearAutoOpen]);
```

### Complete Example

Here's how a complete service page looks with voice command support:

```jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// ... other imports ...
import { useServiceAutoOpen } from '../../components/voice/useServiceAutoOpen';

const electricityServices = [
  { id: 'billing', title: 'Billing', /* ... */ },
  { id: 'new_connections', title: 'New Connection', /* ... */ },
  { id: 'complaints', title: 'Complaints', /* ... */ },
  { id: 'track', title: 'Track', /* ... */ },
  { id: 'connection_mgmt', title: 'Connection Management', /* ... */ },
];

function ElectricityServicesPage() {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Voice command support
  const { autoOpenServiceId, clearAutoOpen } = useServiceAutoOpen();

  // Handle auto-opening service via voice command
  useEffect(() => {
    if (autoOpenServiceId) {
      const validService = electricityServices.find(s => s.id === autoOpenServiceId);
      if (validService) {
        setSelectedService(autoOpenServiceId);
        setDialogOpen(true);
      }
      clearAutoOpen();
    }
  }, [autoOpenServiceId, clearAutoOpen]);

  const handleServiceClick = (serviceId) => {
    setSelectedService(serviceId);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedService(null);
  };

  // ... rest of component ...

  return (
    {/* Your JSX */}
  );
}

export default ElectricityServicesPage;
```

## Service ID Mapping

Make sure your service IDs match the ones defined in `voiceCommands.js`:

### Electricity Services
- `billing` - Billing & Payments
- `new_connections` - New Connections
- `complaints` - Complaints & Requests
- `track` - Track Application/Complaint
- `connection_mgmt` - Connection Management

### Gas Services
- `new_connection` - New Connection
- `refill_booking` - Refill Booking
- `complaint` - Complaints
- `track` - Track Application

### Municipal Services
- `property_tax` - Property Tax
- `birth_death` - Birth/Death Certificate
- `trade_license` - Trade License
- `grievance` - Grievance
- `sanitation` - Sanitation
- `roads` - Roads & Infrastructure

## Testing Your Implementation

After adding voice command support, test it:

1. **Start the app**: `npm run dev`
2. **Click voice command button** (orange mic, bottom-left)
3. **Say a test command**: "Open electricity billing"
4. **Verify**:
   - Page navigates to Electricity department
   - Billing dialog opens automatically
   - URL shows: `/electricity?service=billing`
   - URL parameter is cleared after opening

## Common Issues

### Service Not Opening
**Problem**: Navigation works but dialog doesn't open.

**Solution**: Check that:
- Service ID in `voiceCommands.js` matches your service array
- The useEffect is properly implemented
- `clearAutoOpen()` is called to clean up

### Wrong Service Opens
**Problem**: Different service opens than commanded.

**Solution**:
- Verify service ID mapping in `voiceCommands.js`
- Check your service array has correct IDs
- Console log `autoOpenServiceId` to debug

### URL Parameter Stays
**Problem**: `?service=xyz` stays in URL after opening.

**Solution**: Make sure you're calling `clearAutoOpen()` in the useEffect.

## Adding New Service Commands

To add new service voice commands, edit `frontend/src/components/voice/voiceCommands.js`:

```javascript
// Find SERVICE_COMMANDS array and add:
{
  id: 'my_new_service',
  action: 'openService',
  department: 'electricity', // or 'water', 'gas', 'municipal'
  serviceId: 'my_service_id', // must match service array ID
  keywords: {
    en: ['english command', 'another way to say it'],
    hi: ['हिंदी कमांड', 'दूसरा तरीका'],
    mr: ['मराठी कमांड', 'दुसरा मार्ग'],
  },
  feedback: {
    en: 'Opening my new service',
    hi: 'नई सेवा खोल रहे हैं',
    mr: 'नवीन सेवा उघडत आहे',
  },
}
```

## Pages to Update

Apply these changes to:

- ✅ `pages/water/WaterServicesPage.jsx` - Already done
- ⏳ `pages/electricity/ElectricityServicesPage.jsx` - Pending
- ⏳ `pages/gas/GasServicesPage.jsx` - Pending
- ⏳ `pages/municipal/MunicipalServicesPage.jsx` - Pending

## Best Practices

1. **Always validate service IDs** before opening
2. **Clear auto-open** after handling to prevent re-opening
3. **Use consistent service IDs** across files
4. **Test all commands** after adding new ones
5. **Keep voice commands simple** - users prefer short phrases

## Need Help?

- Check main documentation: `docs/VOICE_COMMANDS.md`
- Review working example: `pages/water/WaterServicesPage.jsx`
- Command definitions: `components/voice/voiceCommands.js`
- Hook implementation: `components/voice/useServiceAutoOpen.js`

---

**Next Steps**: Implement voice command support in remaining service pages (Electricity, Gas, Municipal) following this guide.
