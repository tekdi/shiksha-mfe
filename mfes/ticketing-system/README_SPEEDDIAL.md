# Zoho Desk SpeedDial Component

A Material-UI SpeedDial component for quick access to Zoho Desk ticketing operations.

## Features

✅ **Ticket List Button** - View all your tickets with pagination
✅ **Submit Ticket Button** - Quick access to ticket submission form  
✅ **Smart Popup Handling** - If a popup is open, SpeedDial clicks will close it
✅ **Zoho Widget Integration** - When Zoho widget is open, shows only close button
✅ **Ticket List with Pagination** - Shows tickets with load more functionality
✅ **Uses API endpoint** - Fetches data from `/api/tickets/list`

## Components

### 1. ZohoDeskSpeedDial

Main SpeedDial component with two action buttons.

### 2. TicketListPopup

Popup that displays ticket list with:

- Pagination (10 tickets per page)
- Load more button
- Status and priority color coding
- Refresh functionality
- Error handling

### 3. useTicketList Hook

Custom hook for fetching ticket data with:

- Automatic pagination
- Loading states
- Error handling
- Refresh capability

## Usage

### Basic Usage

```tsx
import { ZohoDeskSpeedDial } from "@/components/zoho/ZohoDeskSpeedDial";

function App() {
  return (
    <div>
      {/* Your app content */}
      <ZohoDeskSpeedDial />
    </div>
  );
}
```

### Advanced Configuration

```tsx
import { ZohoDeskSpeedDial } from "@/components/zoho/ZohoDeskSpeedDial";

function App() {
  const handleSubmitTicket = () => {
    console.log("Custom submit ticket logic");
  };

  const handleTicketListOpen = () => {
    console.log("Ticket list opened");
  };

  return (
    <ZohoDeskSpeedDial
      showTicketList={true}
      showSubmitTicket={true}
      position={{ bottom: 24, right: 24 }}
      onSubmitTicket={handleSubmitTicket}
      onTicketListOpen={handleTicketListOpen}
      hideBackdrop={false}
    />
  );
}
```

## Props

| Prop               | Type                                                               | Default                     | Description                                       |
| ------------------ | ------------------------------------------------------------------ | --------------------------- | ------------------------------------------------- |
| `position`         | `{ bottom?: number, right?: number, top?: number, left?: number }` | `{ bottom: 24, right: 24 }` | SpeedDial position                                |
| `showTicketList`   | `boolean`                                                          | `true`                      | Show ticket list action                           |
| `showSubmitTicket` | `boolean`                                                          | `true`                      | Show submit ticket action                         |
| `onSubmitTicket`   | `() => void`                                                       | `undefined`                 | Callback when submit ticket is clicked (fallback) |
| `onTicketListOpen` | `() => void`                                                       | `undefined`                 | Callback when ticket list is opened               |
| `sx`               | `object`                                                           | `undefined`                 | Custom styles for SpeedDial                       |
| `hideBackdrop`     | `boolean`                                                          | `false`                     | Hide backdrop when SpeedDial is open              |

## Behavior

### Smart Popup Handling

- When any popup is open and you click the SpeedDial, it will close the popup
- This prevents multiple popups from being open simultaneously
- Provides a consistent user experience

### Ticket List Features

- Shows 10 tickets per page initially
- "Load More" button for pagination
- Real-time loading states
- Error handling with retry option
- Refresh button to reload data
- Color-coded status and priority chips
- Responsive design

### Submit Ticket Integration

- Uses `ZohoDeskUtils.openSubmitTicketForm()` when Zoho widget is available
- Falls back to custom `onSubmitTicket` callback if widget is not available
- Automatically closes SpeedDial after action

### Zoho Widget Integration

- **Dynamic State Detection**: Automatically detects when Zoho widget is open
- **Context-Aware Actions**: When Zoho widget is open, SpeedDial shows only a close button
- **Smart Icon Change**: SpeedDial icon changes to close icon when Zoho widget is active
- **One-Click Close**: Click the close action to close the Zoho widget
- **Event Listeners**: Uses Zoho widget events and DOM polling for state detection
- **Seamless UX**: Provides consistent interface regardless of Zoho widget state

## API Integration

The component uses the `/api/tickets/list` endpoint with these parameters:

- `limit`: Number of tickets per page (default: 10)
- `from`: Starting index for pagination
- Additional filters can be added as needed

## Dependencies

- `@mui/material` - SpeedDial, Dialog, and other UI components
- `@mui/icons-material` - Icons for actions and states
- React hooks for state management

## Styling

The component uses Material-UI's theming system and can be customized via:

- `sx` prop for SpeedDial styling
- Theme overrides for global styling
- Position props for placement

## Example Screenshots

### SpeedDial Closed

- Single floating action button with support agent icon

### SpeedDial Open

- Two action buttons: "View Tickets" and "Submit Ticket"
- Animated expansion with tooltips

### Ticket List Popup

- Modal with ticket list
- Status/priority chips
- Load more pagination
- Refresh functionality

## Integration with Zoho Desk

The component integrates seamlessly with the existing Zoho Desk components:

- Uses `ZohoDeskUtils` for widget operations
- Shares the same API endpoints
- Consistent with existing error handling patterns
