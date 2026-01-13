declare module 'react-native-otp-verify' {
  export function getHash(): Promise<string[]>;
  export function startOtpListener(handler: (message: string) => void): void;
  export function removeListener(): void;
  export function addListener(handler: (message: string) => void): void;
  export function getOtp(): Promise<string>;
}
