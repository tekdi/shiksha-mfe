export const timeAgo = (dateString: string) => {
  const now: any = new Date();
  const date: any = new Date(dateString);
  const secondsAgo = Math.floor((now - date) / 1000);

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(secondsAgo / interval.seconds);
    if (count > 0) {
      return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
) => {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    const context = this;
    clearTimeout(timeout);
    if (immediate && !timeout) func.apply(context, args);
    timeout = setTimeout(() => {
      timeout = undefined;
      if (!immediate) func.apply(context, args);
    }, wait);
  };
};

export const handleExitEvent = (isFromShortVideo?: boolean) => {
  if (isFromShortVideo) {
    window.parent.postMessage({ eid: "EXIT" }, "*");
    return;
  }
  const previousPage = sessionStorage.getItem('previousPage');
  if (previousPage) {
    window.location.href = previousPage;
  } else {
    window.history.go(-1);
  }
};

export const getOptionsByCategory = (frameworks: any, categoryCode: string) => {
  // Find the category by code
  const category = frameworks.categories.find(
    (category: any) => category.code === categoryCode
  );

  // Return the mapped terms
  return category.terms.map((term: any) => ({
    name: term.name,
    code: term.code,
    associations: term.associations,
  }));
};
export const getTelemetryEvents = (eventData: any, contentType: string) => {
  console.log('getTelemetryEvents hit');

  if (!eventData?.object?.id) {
    console.error('Invalid event data');
    return;
  }

  const {
    eid,
    edata,
    object: { id: identifier },
  } = eventData;
  const telemetryKey = `${contentType}_${identifier}_${eid}`;

  const telemetryData = {
    eid,
    edata,
    identifier,
    contentType,
  };

  console.log(`${eid}Telemetry`, telemetryData);

  localStorage.setItem(telemetryKey, JSON.stringify(telemetryData));
};
