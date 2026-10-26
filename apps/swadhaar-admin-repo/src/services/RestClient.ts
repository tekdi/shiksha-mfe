import axiosInstance from './Interceptor';
import { AxiosRequestConfig, AxiosResponse } from 'axios';

export function get(
  url: string,
  headers: AxiosRequestConfig['headers'] = {}
): Promise<AxiosResponse> {
  return axiosInstance.get(url, { headers });
}

export function post<T>(
  url: string,
  body: T,
  headers: AxiosRequestConfig['headers'] = {}
): Promise<AxiosResponse> {
  return axiosInstance.post(url, body, { headers });
}

export function put<T>(
  url: string,
  body: T,
  headers: AxiosRequestConfig['headers'] = {}
): Promise<AxiosResponse> {
  return axiosInstance.put(url, body, { headers });
}

export function patch<T>(
  url: string,
  body: T,
  headers: AxiosRequestConfig['headers'] = {}
): Promise<AxiosResponse> {
  return axiosInstance.patch(url, body, { headers });
}

export function deleteApi<T>(
  url: string,
  body?: T,
  headers: AxiosRequestConfig['headers'] = {}
): Promise<AxiosResponse> {
  return axiosInstance.delete(url, { data: body, headers });
}
