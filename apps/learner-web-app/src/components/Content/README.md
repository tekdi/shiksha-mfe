# SunbirdVideoReel Component

A React component for displaying educational videos in a TikTok-style vertical reel format, compatible with Sunbird and Diksha content sources.

## Features

- Vertical scrolling video reel interface
- Support for multiple content sources (Sunbird, Diksha)
- Interactive video controls (play/pause, mute/unmute, like, share)
- Assessment integration with quiz functionality
- Telemetry tracking for analytics
- Responsive design for mobile and desktop
- Auto-play functionality with scroll detection

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `playerLink` | `string` | Yes | URL to the video player |
| `baseUrl` | `BaseUrl` | Yes | Object containing API base URLs for different sources |
| `defaultSource` | `string` | Yes | Default content source to use when not specified in items |
| `items` | `VideoItem[]` | Yes | Array of video items to display |
| `getTelemetry` | `(data: any) => void` | No | Callback function for telemetry data |

### Types

```typescript
interface VideoItem {
  content_id: string;
  assessmentId?: string;
  source?: string;
}

interface BaseUrl {
  sunbird: string;
  diksha: string;
}
```

## Usage Example

```tsx
import SunbirdVideoReel from './SunbirdVideoReel';

const App = () => {
  const handleTelemetry = (data) => {
    console.log("Telemetry data:", data);
    // Send to your analytics service
  };

  return (
    <SunbirdVideoReel
      playerLink="https://player.example.com"
      baseUrl={{
        sunbird: "https://api.example.com/red",
        diksha: "https://api.example.com/red"
      }}
      defaultSource="sunbird"
      items={[
        { content_id: "do_123", assessmentId: "do_234", source: "sunbird" },
        { content_id: "do_456", assessmentId: "do_567", source: "diksha" }
      ]}
      getTelemetry={handleTelemetry}
    />
  );
};
```

## Telemetry Events

The component emits various telemetry events through the `getTelemetry` callback:

- **IMPRESSION**: When a video comes into view
- **START**: When video playback begins
- **END**: When video playback ends
- **INTERACT**: When user interacts with controls (play/pause)
- **ASSESS**: When user completes an assessment

### Telemetry Data Structure

```typescript
{
  type: string;        // Event type (IMPRESSION, START, END, etc.)
  eid: string;         // Event identifier
  edata: {             // Event data
    id: string;        // Content or interaction ID
    type: string;      // Content type (video, quiz, etc.)
    score?: number;    // Assessment score (for ASSESS events)
    pageid?: string;   // Page identifier (for IMPRESSION events)
  }
}
```

## Notes

- Ensure the provided API URLs are accessible
- The items array should contain valid objects with `content_id`, optional `assessmentId`, and optional `source`
- If `source` is missing from an item, `defaultSource` will be used
- The player must support the provided video formats
- Component includes fallback mock data for demonstration purposes
- Videos can be displayed either as direct video elements or embedded iframes depending on the URL format

## Dependencies

- React
- Material-UI (@mui/material, @mui/icons-material)
- axios (for API calls)

## Styling

The component uses Material-UI's styling system and includes responsive design for mobile and desktop viewports. Custom CSS modules are used for additional styling where needed.