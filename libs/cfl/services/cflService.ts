import { post } from '@shared-lib';
import { Trainer, CourseProgress, AlertFeedback } from '../types';

const BASE_URL = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'https://middleware-shikshav2.shikshagraha.org';

export const getTrainerList = async (tenantId: string): Promise<Trainer[]> => {
  const apiUrl = `${BASE_URL}/user/list`;
  const payload = {
    limit: 50,
    offset: 0,
    filters: {
      role: 'Learner',
      tenantId: tenantId,
    },
  };

  try {
    const response = await post(apiUrl, payload);
    const users = response?.data?.result?.userData || [];
    
    // Mapping to our Trainer interface
    // In a real scenario, we'd also fetch progress stats for each trainer
    const trainers = users.map((u: any) => ({
      id: u.userId,
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username,
      avatarUrl: u.avatar,
      currentLevel: u.currentLevel || 'Beginner Level',
      location: `CFL: ${u.state || 'Jharkhand'} - ${u.district || 'Torpa'}`,
      progress: Math.floor(Math.random() * 101),
      courses: [
        { id: '1', name: 'Beginner Level', status: 'completed', completionCount: 4, totalCount: 4 },
        { id: '2', name: 'Intermediate Level', status: 'in-progress', completionCount: 1, totalCount: 4 },
        { id: '3', name: 'Advance Level', status: 'locked', completionCount: 0, totalCount: 4 },
      ]
    }));

    if (trainers.length === 0) {
      return [
        { id: '1', name: 'Jaya K', currentLevel: 'Advance Level', location: 'CFL: Jharkhand - Torpa', progress: 100, courses: [{ id: '1', name: 'Beginner Level', status: 'completed', completionCount: 4, totalCount: 4 }, { id: '2', name: 'Intermediate Level', status: 'in-progress', completionCount: 1, totalCount: 4 }, { id: '3', name: 'Advance Level', status: 'locked', completionCount: 0, totalCount: 4 }] },
        { id: '2', name: 'Pappu', currentLevel: 'Intermediate Level', location: 'CFL: Jharkhand - Torpa', progress: 100, courses: [{ id: '1', name: 'Beginner Level', status: 'completed', completionCount: 4, totalCount: 4 }, { id: '2', name: 'Intermediate Level', status: 'in-progress', completionCount: 1, totalCount: 4 }, { id: '3', name: 'Advance Level', status: 'locked', completionCount: 0, totalCount: 4 }] },
        { id: '3', name: 'Seema', currentLevel: 'Intermediate Level', location: 'CFL: Jharkhand - Torpa', progress: 75, courses: [{ id: '1', name: 'Beginner Level', status: 'completed', completionCount: 4, totalCount: 4 }, { id: '2', name: 'Intermediate Level', status: 'in-progress', completionCount: 1, totalCount: 4 }, { id: '3', name: 'Advance Level', status: 'locked', completionCount: 0, totalCount: 4 }] },
        { id: '4', name: 'Sagar', currentLevel: 'Beginner Level', location: 'CFL: Jharkhand - Torpa', progress: 0, courses: [{ id: '1', name: 'Beginner Level', status: 'completed', completionCount: 4, totalCount: 4 }, { id: '2', name: 'Intermediate Level', status: 'in-progress', completionCount: 1, totalCount: 4 }, { id: '3', name: 'Advance Level', status: 'locked', completionCount: 0, totalCount: 4 }] },
      ];
    }
    return trainers;
  } catch (error) {
    console.error('Error fetching trainer list:', error);
    return [
      { id: '1', name: 'Jaya K', currentLevel: 'Advance Level', location: 'CFL: Jharkhand - Torpa', progress: 100, courses: [{ id: '1', name: 'Beginner Level', status: 'completed', completionCount: 4, totalCount: 4 }, { id: '2', name: 'Intermediate Level', status: 'in-progress', completionCount: 1, totalCount: 4 }, { id: '3', name: 'Advance Level', status: 'locked', completionCount: 0, totalCount: 4 }] },
      { id: '2', name: 'Pappu', currentLevel: 'Intermediate Level', location: 'CFL: Jharkhand - Torpa', progress: 100, courses: [{ id: '1', name: 'Beginner Level', status: 'completed', completionCount: 4, totalCount: 4 }, { id: '2', name: 'Intermediate Level', status: 'in-progress', completionCount: 1, totalCount: 4 }, { id: '3', name: 'Advance Level', status: 'locked', completionCount: 0, totalCount: 4 }] },
      { id: '3', name: 'Seema', currentLevel: 'Intermediate Level', location: 'CFL: Jharkhand - Torpa', progress: 75, courses: [{ id: '1', name: 'Beginner Level', status: 'completed', completionCount: 4, totalCount: 4 }, { id: '2', name: 'Intermediate Level', status: 'in-progress', completionCount: 1, totalCount: 4 }, { id: '3', name: 'Advance Level', status: 'locked', completionCount: 0, totalCount: 4 }] },
      { id: '4', name: 'Sagar', currentLevel: 'Beginner Level', location: 'CFL: Jharkhand - Torpa', progress: 0, courses: [{ id: '1', name: 'Beginner Level', status: 'completed', completionCount: 4, totalCount: 4 }, { id: '2', name: 'Intermediate Level', status: 'in-progress', completionCount: 1, totalCount: 4 }, { id: '3', name: 'Advance Level', status: 'locked', completionCount: 0, totalCount: 4 }] },
    ];
  }
};

export const getTrainerProgress = async (trainerId: string, tenantId: string): Promise<CourseProgress[]> => {
  // Placeholder for composite API
  // Returning mock data that matches Figma structure
  return [
    {
      id: 'c1',
      name: 'Swadhaar Financial Literacy',
      levels: [
        {
          name: 'REI New Content',
          status: 'completed',
          modules: [
            { id: 'm0', name: 'Introduction', status: 'completed', completionCount: 4, totalCount: 4, subtopics: [] }
          ]
        },
        {
          name: 'Beginner Level',
          status: 'completed',
          modules: [
            { id: 'm1', name: 'Module 1', status: 'completed', completionCount: 4, totalCount: 4, subtopics: [] },
            { id: 'm2', name: 'Module 2', status: 'completed', completionCount: 4, totalCount: 4, subtopics: [] },
            { 
              id: 'm3', 
              name: 'Module 3', 
              status: 'in-progress', 
              completionCount: 2, 
              totalCount: 4,
              subtopics: [
                { id: 's1', name: 'Subtopic 1', status: 'completed', completionCount: 4, totalCount: 4, lessons: [] },
                { 
                  id: 's2', 
                  name: 'Subtopic 2', 
                  status: 'in-progress', 
                  completionCount: 1, 
                  totalCount: 4,
                  lessons: [
                    { id: 'l1', name: 'Lesson 1', type: 'lesson', status: 'completed' },
                    { id: 'q1', name: 'Quiz 1', type: 'quiz', status: 'in-progress' },
                    { id: 'l3', name: 'Lesson 3', type: 'lesson', status: 'locked' },
                    { id: 'l4', name: 'Lesson 4', type: 'lesson', status: 'locked' },
                  ]
                }
              ]
            },
            { id: 'm4', name: 'Module 4', status: 'locked', completionCount: 0, totalCount: 4, subtopics: [] },
          ]
        },
        {
          name: 'Intermediate Level',
          status: 'locked',
          modules: []
        }
      ]
    }
  ];
};

export const sendAlert = async (feedback: AlertFeedback): Promise<boolean> => {
  const apiUrl = `${BASE_URL}/notification/send`;
  try {
    await post(apiUrl, feedback);
    return true;
  } catch (error) {
    console.error('Error sending alert:', error);
    return false;
  }
};
