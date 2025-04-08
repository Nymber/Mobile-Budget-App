declare module 'axios/lib/core/AxiosError' {
  import { AxiosError } from 'axios';
  export const isAxiosError: typeof AxiosError.isAxiosError;
}
