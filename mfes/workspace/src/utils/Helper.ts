/* eslint-disable @typescript-eslint/no-this-alias */
import { labelsToExtractForMiniProfile, Role, Status } from "./app.constant";
import {
  avgLearnerAttendanceLimit,
  lowLearnerAttendanceLimit,
} from "./app.config";
import { UpdateCustomField } from "./interfaces";
import FingerprintJS from "fingerprintjs2";
export const timeAgo = (dateString: string) => {
  const now: any = new Date();
  const date: any = new Date(dateString);
  const secondsAgo = Math.floor((now - date) / 1000);

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
    { label: "second", seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(secondsAgo / interval.seconds);
    if (count > 0) {
      return `${count} ${interval.label}${count !== 1 ? "s" : ""} ago`;
    }
  }

  return "just now";
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

export const handleExitEvent = () => {
  const previousPage = sessionStorage.getItem("previousPage");
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
  console.log("getTelemetryEvents hit");

  if (!eventData || !eventData.object || !eventData.object.id) {
    console.error("Invalid event data");
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
export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};
export const getTodayDate = () => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Adding 1 as month is zero-indexed
  const day = String(currentDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
export const shortDateFormat = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
export function deepClone<T>(obj: T): T {
  // Check if structuredClone is available
  if (typeof structuredClone === "function") {
    return structuredClone(obj);
  }

  // Fallback to JSON method for deep cloning
  return JSON.parse(JSON.stringify(obj));
}
export const getDayMonthYearFormat = (dateString: string) => {
  const [year, monthIndex, day] = dateString.split("-");
  const date = new Date(
    parseInt(year, 10),
    parseInt(monthIndex, 10) - 1,
    parseInt(day, 10)
  );
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export const ATTENDANCE_ENUM = {
  PRESENT: "present",
  ABSENT: "absent",
  HALF_DAY: "half-day",
  NOT_MARKED: "notmarked",
  ON_LEAVE: "on-leave",
};
export function filterMiniProfileFields(customFieldsData: UpdateCustomField[]) {
  const filteredFields = [];
  for (const item of customFieldsData) {
    if (labelsToExtractForMiniProfile.includes(item.label ?? "")) {
      filteredFields.push({ label: item?.label, value: item?.value });
    }
  }
  return filteredFields;
}
export const toPascalCase = (name: string | any) => {
  if (typeof name !== "string") {
    return name;
  }

  return name
    ?.toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
export const translateString = (t: any, label: string) => {
  return t(`FORM.${label}`) === `FORM.${label}`
    ? toPascalCase(label)
    : t(`FORM.${label}`);
};
export const filterAttendancePercentage = (
  data: any[],
  category: "more" | "between" | "less"
) => {
  return data.filter(({ present_percent }: { present_percent: string }) => {
    const attendance = parseFloat(present_percent);

    if (isNaN(attendance)) return false; // Exclude invalid or missing values

    switch (category) {
      case "more":
        return attendance > avgLearnerAttendanceLimit;
      case "between":
        return (
          attendance >= lowLearnerAttendanceLimit &&
          attendance <= avgLearnerAttendanceLimit
        ); // Medium attendance
      case "less":
        return attendance < lowLearnerAttendanceLimit;
      default:
        return false;
    }
  });
};
export const formatSelectedDate = (inputDate: string | Date) => {
  const date = new Date(inputDate);
  const year = date.getFullYear();
  const month = ("0" + (date.getMonth() + 1)).slice(-2);
  const day = ("0" + date.getDate()).slice(-2);
  return `${year}-${month}-${day}`;
};
export const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
  if (event.key === "Enter") {
    const focusedInput = document.activeElement;
    if (focusedInput instanceof HTMLElement) {
      focusedInput.blur();
    }
  }
};
export const sortAttendanceNumber = (data: any[], order: string) => {
  return data.sort(
    (
      a: { memberStatus: string; present_percent: string },
      b: { memberStatus: string; present_percent: string }
    ) => {
      if (
        a.memberStatus === Status.DROPOUT &&
        b.memberStatus !== Status.DROPOUT
      )
        return 1;
      if (
        a.memberStatus !== Status.DROPOUT &&
        b.memberStatus === Status.DROPOUT
      )
        return -1;
      const aPercent = parseFloat(a.present_percent);
      const bPercent = parseFloat(b.present_percent);
      if (isNaN(aPercent) && isNaN(bPercent)) return 0;
      if (isNaN(aPercent)) return 1;
      if (isNaN(bPercent)) return -1;
      return order === "high" ? bPercent - aPercent : aPercent - bPercent;
    }
  );
};
export const getDayAndMonthName = (dateString: Date | string) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString("default", { month: "long" });
  return `${day} ${month}`;
};
export const formatToShowDateMonth = (date: Date) => {
  const day = date.toLocaleString("en-US", { day: "2-digit" });
  const month = date.toLocaleString("en-US", { month: "long" });
  return `${day} ${month}`;
};
export const accessGranted = (
  action: string,
  accessControl: { [key: string]: Role[] },
  currentRole: Role
): boolean => {
  if (accessControl[action]?.includes(currentRole)) {
    return true;
  }
  return false;
};
export const capitalizeEachWord = (str: string) => {
  return str.toUpperCase();
};
export const generateUUID = () => {
  let d = new Date().getTime();
  let d2 =
    (typeof performance !== "undefined" &&
      performance.now &&
      performance.now() * 1000) ||
    0;
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = Math.random() * 16; //NOSONAR
    if (d > 0) {
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
};

export const getDeviceId = () => {
  return new Promise((resolve) => {
    FingerprintJS.get((components: any[]) => {
      const values = components.map((component) => component.value);
      const deviceId = FingerprintJS.x64hash128(values.join(""), 31);
      resolve(deviceId);
    });
  });
};
export interface UserEntry {
  userId: string;
  name: string;
  memberStatus: string;
  createdAt: string;
  updatedAt: string;
  firstName?: string;
}

export function getLatestEntries(
  nameUserIdArray: UserEntry[],
  selectedDate: string
): UserEntry[] {
  const filteredEntries: Record<string, UserEntry> = {};

  nameUserIdArray.forEach((entry) => {
    const { userId, updatedAt, createdAt } = entry;
    const updatedDate = new Date(updatedAt);
    updatedDate.setHours(0, 0, 0, 0);
    const selectDate = new Date(selectedDate);
    selectDate.setHours(0, 0, 0, 0);
    const createdDate = new Date(createdAt);
    createdDate.setHours(0, 0, 0, 0);

    // Only consider entries with updatedAt < selectedDate or createdDate <= selectDate
    if (updatedDate < selectDate || createdDate <= selectDate) {
      if (
        !filteredEntries[userId] ||
        new Date(filteredEntries[userId].updatedAt) < updatedDate
      ) {
        // Update the entry if it is newer
        filteredEntries[userId] = entry;
      }
    }
  });
  return Object.values(filteredEntries);
}
