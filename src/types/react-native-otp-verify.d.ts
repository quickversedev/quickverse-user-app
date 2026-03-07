declare module 'react-native-otp-verify' {
  import { EmitterSubscription } from 'react-native';

  export function getHash(): Promise<string[]>;
  export function startOtpListener(handler: (message: string) => void): Promise<EmitterSubscription>;
  export function removeListener(): void;
  export function addListener(handler: (message: string) => void): void;
  export function getOtp(): Promise<string>;
  export function requestHint(): Promise<string>;

  export function useOtpVerify(options?: {
    numberOfDigits?: number;
  }): {
    otp: string | null;
    message: string | null;
    timeoutError: boolean;
    stopListener: () => void;
    startListener: () => void;
    hash: string[];
  };
}
