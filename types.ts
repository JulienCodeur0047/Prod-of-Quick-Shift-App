export interface Company {
  id: string;
  name: string;
  ownerId: string;
  subscriptionId: string | null;
}

export interface Role {
  id: string;
  name: string;
  companyId: string;
}

export interface Location {
  id: string;
  name: string;
  address?: string;
  companyId: string;
}

export interface Department {
  id: string;
  name: string;
  companyId: string;
}

export interface AbsenceType {
  id: string;
  name:string;
  color: string;
  companyId: string;
}

export interface SpecialDayType {
  id: string;
  name: string;
  isHoliday: boolean;
  companyId: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  phone: string;
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  companyId: string;
  accessCode?: string;
}

export interface Shift {
  id: string;
  employeeId: string | null;
  startTime: Date;
  endTime: Date;
  locationId?: string;
  departmentId?: string;
  companyId: string;
  actualStartTime?: Date;
  actualEndTime?: Date;
}

export interface Absence {
    id: string;
    employeeId: string;
    absenceTypeId: string;
    startDate: Date;
    endDate: Date;
    companyId: string;
}

export interface SpecialDay {
    id: string;
    date: Date;
    typeId: string;
    coverage: 'all-day' | 'morning' | 'afternoon' | 'evening';
    companyId: string;
}


export type View = 'dashboard' | 'schedule' | 'employees' | 'settings' | 'profile';

export type Plan = 'Gratuit' | 'Pro' | 'Pro Plus';

export type BusinessType = 'Individual' | 'Company' | 'Other';
export type ActivitySector = 'Individual' | 'Health' | 'Technology' | 'Administration' | 'Finance' | 'Commerce' | 'Social' | 'Other';

export interface User {
    id: string;
    name: string;
    email: string;
    password?: string; // Stored in DB, but not held in client-side user state after login.
    plan: Plan;
    avatarUrl: string | null;
    businessType: BusinessType;
    companyName: string;
    activitySector?: ActivitySector;
    address?: string;
    isVerified: boolean;
    companyId: string;
}

export interface Subscription {
    id: string;
    userId: string;
    companyId: string;
    plan: Plan;
    status: 'active' | 'canceled' | 'past_due';
    startDate: Date;
    nextPaymentDate: Date;
    renewalDate: Date;
}

export interface Payment {
    id: string;
    userId: string;
    subscriptionId: string;
    date: Date;
    amount: number;
    plan: Plan;
    status: 'Paid' | 'Failed';
}

export interface InboxMessage {
  id: string;
  employeeId: string;
  type: 'absence-request' | 'complaint';
  subject: string;
  body: string;
  date: Date;
  status: 'pending' | 'validated' | 'refused' | 'followed-up';
  // For absence requests
  absenceTypeId?: string;
  startDate?: Date;
  endDate?: Date;
  refusalReason?: string;
  companyId: string;
}

export type AvailabilityStatus = 'available' | 'preferred' | 'unavailable';
export type TimeBlock = 'morning' | 'afternoon' | 'evening';

export type DayAvailability = {
  [key in TimeBlock]: AvailabilityStatus;
};

// Index 0 = Monday, ..., 6 = Sunday
export type WeeklyAvailability = [DayAvailability, DayAvailability, DayAvailability, DayAvailability, DayAvailability, DayAvailability, DayAvailability];

export interface EmployeeAvailability {
    id: string;
    employeeId: string;
    availability: WeeklyAvailability;
    companyId: string;
}