export interface InitialConfigResponse {
  defaultThemeEnabled: boolean;
  regionId: string;
  themeId: string;
  defaultLocation: {
    latitude: string;
    longitude: string;
  };
}

export interface InitialConfigParams {
  longitude?: string;
  latitude?: string;
}
