import { post } from './RestClient';
interface LoginParams {
  username: string;
  password: string;
}
interface RefreshParams {
  refresh_token: string;
}

let baseUrl = 'https://default-api-url.com';

export const login = async ({
  username,
  password,
}: LoginParams): Promise<any> => {
  const apiUrl: string = `${baseUrl}/auth/login`;

  try {
    const response = await post(apiUrl, { username, password });
    return response?.data;
  } catch (error) {
    console.error('error in login', error);
    throw error;
  }
};

export const refresh = async ({
  refresh_token,
}: RefreshParams): Promise<any> => {
  const apiUrl: string = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`;
  try {
    const response = await post(apiUrl, { refresh_token });
    return response?.data;
  } catch (error) {
    console.error('error in refresh', error);
    throw error;
  }
};
