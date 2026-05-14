/* eslint-disable no-unused-vars */
import { TFunction } from 'i18next';
import pdf from '../../assets/images/PDF.svg';
import epub from '../../assets/images/Epub.svg';
import html from '../../assets/images/HTML.svg';
import mp4 from '../../assets/images/MP4.svg';
import qml from '../../assets/images/Qml.svg';
import youtube from '../../assets/images/youtube.svg';
import h5p from '../../assets/images/h5p.png';
import unit from '../../assets/images/Unit.png';

// background image

import bgpdf from '../../assets/images/bgPDF.svg';
import bgepub from '../../assets/images/bgEpub.svg';
import bghtml from '../../assets/images/bgHtml.svg';
import bgmp4 from '../../assets/images/bgMP4 .svg';
import bgqml from '../../assets/images/bgQml.svg';
import bgyoutube from '../../assets/images/bgYouTube.svg';
import bgh5p from '../../assets/images/bgh5p.png';
import bgunit from '../../assets/images/bgUnit.png';

export const limit: number = 300;
export const refetchInterval: number = 5 * 60 * 1000; // 5 min
export const gcTime: number = 10 * 60 * 1000; // 10 Min

export const labelsToExtractForMiniProfile = [
  'AGE',
  'GENDER',
  'LEARNERS_PRIMARY_WORK',
  'TYPE_OF_LEARNER',
];

export const getMenuItems = (
  t: TFunction,
  dateRange: string | Date,
  currentDayMonth: string | Date
) => {
  return [
    t('DASHBOARD.LAST_SEVEN_DAYS_RANGE', {
      date_range: dateRange,
    }),
    t('DASHBOARD.AS_OF_TODAY_DATE', {
      day_date: currentDayMonth,
    }),
    t('COMMON.LAST_MONTH'),
    t('COMMON.LAST_SIX_MONTHS'),
    t('COMMON.CUSTOM_RANGE'),
  ];
};

export const names = [
  'name',
  'age',
  'gender',
  'student_type',
  'enrollment_number',
  'primary_work',
];

export enum Role {
  STUDENT = 'Learner',
  TEACHER = 'Instructor',
  TEAM_LEADER = 'Lead',
  ADMIN = 'State Lead',
}

export enum Status {
  DROPOUT = 'dropout',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

export enum cohortHierarchy {
  BLOCK = 'BLOCK',
  COHORT = 'COHORT',
}

export enum sessionMode {
  ONLINE = 'online',
  OFFLINE = 'offline',
}

export enum cohortPrivileges {
  STUDENT = 'Learner',
}

export enum FormContext {
  USERS = 'USERS',
  COHORTS = 'COHORTS',
  COHORT_MEMBER = 'COHORTMEMBER',
}

export enum FormContextType {
  STUDENT = 'LEARNER',
  TEACHER = 'INSTRUCTOR',
  TEAM_LEADER = 'LEAD',
  COHORT = 'COHORT',
  COHORT_MEMBER = 'COHORTMEMBER',
}
export enum ObservationEntityType {
  LEARNER = 'learner',
  FACILITATOR = 'facilitator',
  CENTER = 'center',
}
export enum ObservationStatus {
  DRAFT = 'draft',
  COMPLETED = 'completed',
  NOT_STARTED = 'notstarted',
  STARTED = 'started',
  ALL = 'All',
}

export enum CenterType {
  REGULAR = 'REGULAR',
  REMOTE = 'REMOTE',
  UNKNOWN = 'UNKNOWN',
}

export enum RoleId {
  STUDENT = 'eea7ddab-bdf9-4db1-a1bb-43ef503d65ef',
  TEACHER = 'a5f1dbc9-2ad4-442c-b762-0e3fc1f6c6da',
  TEAM_LEADER = 'c4454929-954e-4c51-bb7d-cca834ab9375',
  ADMIN = '4a3493aa-a4f7-4e2b-b141-f213084b5599',
}

export enum Pagination {
  ITEMS_PER_PAGE = 10,
  MAX_ITEMS = 50,
}
export enum LeftDays {
  ONE_DAY_IN_MILLISECONDS = 1000 * 60 * 60 * 24,
}

export enum Telemetry {
  CLICK = 'CLICK',
  SEARCH = 'SEARCH',
  VIEW = 'VIEW',
}
export enum TelemetryEventType {
  CLICK = 'CLICK',
  SEARCH = 'SEARCH',
  VIEW = 'VIEW',
  RADIO = 'RADIO',
}
export enum AssessmentStatus {
  NOT_STARTED = 'Not_Started',
  IN_PROGRESS = 'In_Progress',
  COMPLETED = 'Completed',
  COMPLETED_SMALL = 'completed',
}

export enum QueryKeys {
  GET_ACTIVE_FACILITATOR = 'getActiveFacilitatorList',
  MY_COHORTS = 'myCohorts',
}

export enum CoursePlannerConstants {
  SUBJECT = 'SUBJECT',
  STATES = 'STATES',
  BOARD = 'BOARD',
  MEDIUM = 'MEDIUM',
  GRADE = 'GRADE',

  SUBJECT_SMALL = 'Subject',
  STATES_SMALL = 'State',
  BOARD_SMALL = 'Board',
  MEDIUM_SMALL = 'Medium',
  GRADE_SMALL = 'Grade',
}

export enum EventStatus {
  UPCOMING = 'UPCOMING',
  LIVE = 'LIVE',
  PASSED = 'PASSED',
}

export const metaTags = {
  title: 'Pratham Learning Management App',
  description:
    "Pratham's Second Chance program focuses on providing school dropouts, especially young girls and women, another chance at education. Second Chance aims to support those who could not complete their secondary education. The program focuses on completion of Grade 10. The academic certificate that they receive opens the door for further opportunities for lifelong learning and growth. The Second Chance program uses innovative teaching methods, to provide accessible learning opportunities very close to where the students live.",
  keywords: 'Second Chance Program',
};

export enum ResourcesType {
  PREREQUSITE = 'prerequisite',
  POSTREQUSITE = 'postrequisite',
  NONE = 'none',
}
export const FeesStepBoards = ['NIOS'];

import { StaticImageData } from 'next/image'; // Import StaticImageData for type safety with images

// Define the enum for content types

export enum ContentType {
  PDF = 'application/pdf',
  EPUB = 'application/epub',
  HTML = 'application/vnd.ekstep.html-archive',
  VIDEO_MP4 = 'video/mp4',
  QUESTION_SET = 'application/vnd.sunbird.questionset',
  H5P = 'application/vnd.ekstep.h5p-archive',
  YOUTUBE_VIDEO = 'video/youtube',
  YOUTUBE_X_VIDEO = 'video/x-youtube',
  WEBM_VIDEO = 'video/webm',
  COLLECTION = 'application/vnd.ekstep.content-collection',
  //new types
  AUDIO_MP3 = 'audio/mp3',
  AUDIO_WAV = 'audio/wav',
}

// Define the type for the content type mapping
export type FileType = {
  [key in ContentType]: {
    name: string;
    imgPath: StaticImageData;
    BgImgPath?: StaticImageData;
  };
};

// Create the mapping object with enum keys
export const ContentCardsTypes: FileType = {
  //@ts-ignore
  [ContentType.PDF]: { name: 'PDF', imgPath: pdf, BgImgPath: bgpdf },
  //@ts-ignore
  [ContentType.EPUB]: { name: 'EPUB', imgPath: epub, BgImgPath: bgepub },
  //@ts-ignore
  [ContentType.HTML]: { name: 'HTML', imgPath: html, BgImgPath: bghtml },
  //@ts-ignore
  [ContentType.VIDEO_MP4]: { name: 'Video', imgPath: mp4, BgImgPath: bgmp4 },
  [ContentType.QUESTION_SET]: {
    name: 'Question Set',
    //@ts-ignore
    imgPath: qml,
    //@ts-ignore
    BgImgPath: bgqml,
  },
  //@ts-ignore
  [ContentType.H5P]: { name: 'H5P', imgPath: h5p, BgImgPath: bgh5p },
  [ContentType.YOUTUBE_X_VIDEO]: {
    name: 'YouTube',
    //@ts-ignore
    imgPath: youtube,
    //@ts-ignore
    BgImgPath: bgyoutube,
  },
  [ContentType.YOUTUBE_VIDEO]: {
    name: 'YouTube',
    //@ts-ignore
    imgPath: youtube,
    //@ts-ignore
    BgImgPath: bgyoutube,
  },
  //@ts-ignore
  [ContentType.WEBM_VIDEO]: { name: 'WEBM', imgPath: mp4, BgImgPath: bgmp4 },
  [ContentType.COLLECTION]: {
    name: 'Course',
    //@ts-ignore
    imgPath: unit,
    //@ts-ignore
    BgImgPath: bgunit,
  },
  [ContentType.AUDIO_MP3]: { name: 'Audio',
    //@ts-ignore
     imgPath: mp4,
    //@ts-ignore
     BgImgPath: bgmp4 },
  [ContentType.AUDIO_WAV]: { name: 'Audio', 
    //@ts-ignore
    imgPath: mp4, 
    //@ts-ignore
    BgImgPath: bgmp4 },
};

export enum contentStatus {
  COMPLETED = 'Completed',
  IN_PROGRESS = 'In_Progress',
  NOT_STARTED = 'Not_Started',
}

export enum sessionType {
  PLANNED = 'planned',
  EXTRA = 'extra',
}
