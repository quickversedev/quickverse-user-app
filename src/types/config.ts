export interface InitialConfigResponse {
  defaultThemeEnabled: boolean;
  regionId: string;
  themeId: string;
  defaultLocation: {
    latitude: string;
    longitude: string;
  };
  deliveryDistance: number;

}


export interface InitialConfigParams {
  longitude?: string;
  latitude?: string;
}
