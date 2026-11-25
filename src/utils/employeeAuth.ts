export interface EmployeeLoginProfile {
  id: string;
  name: string;
  photoUrl: string | null;
  storeName: string | null;
}

export interface EmployeeLoginSession {
  access_token: string;
  refresh_token: string;
}

export interface EmployeeLoginResponse {
  session: EmployeeLoginSession;
}

export interface EmployeeLoginProfilesResponse {
  profiles: EmployeeLoginProfile[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isValidEmployeePin(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

export function isEmployeeLoginProfilesResponse(
  value: unknown,
): value is EmployeeLoginProfilesResponse {
  if (!isRecord(value) || !Array.isArray(value.profiles)) return false;

  return value.profiles.every(
    (profile) =>
      isRecord(profile) &&
      typeof profile.id === 'string' &&
      typeof profile.name === 'string' &&
      (typeof profile.photoUrl === 'string' || profile.photoUrl === null) &&
      (typeof profile.storeName === 'string' || profile.storeName === null),
  );
}

export function isEmployeeLoginResponse(value: unknown): value is EmployeeLoginResponse {
  if (!isRecord(value) || !isRecord(value.session)) return false;

  return (
    typeof value.session.access_token === 'string' &&
    value.session.access_token.length > 0 &&
    typeof value.session.refresh_token === 'string' &&
    value.session.refresh_token.length > 0
  );
}
