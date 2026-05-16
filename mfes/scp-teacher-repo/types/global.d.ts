interface Window {
  GA_INITIALIZED: boolean;
}

declare namespace JSX {
  interface IntrinsicElements {
    "questionnaire-player-main": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      assessment?: string;
      fileuploadresponse?: string;
    };
  }
}

declare module 'date-fns';

interface Navigator {
  standalone?: boolean;
}

declare module '*.svg' {
  const content: any;
  export default content;
}

declare module '*.png' {
  const content: any;
  export default content;
}

declare module '*.jpg' {
  const content: any;
  export default content;
}
