import axios from 'axios';
interface LoginParams {
  username: string;
  password: string;
}
export const getToken = async ({ username }: LoginParams) => {
  const data = new URLSearchParams({
    client_id: `${process.env.NEXT_PUBLIC_CLIENT_ID}`,
    client_secret: `${process.env.NEXT_PUBLIC_CLIENT_SECRET}`,
    grant_type: `${process.env.NEXT_PUBLIC_GRANT_TYPE}`,
    username: username,
  });

  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BASE_URL}/auth/realms/sunbird/protocol/openid-connect/token`,
      data,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response?.data;
  } catch (error) {
    console.log(error);
  }
};
