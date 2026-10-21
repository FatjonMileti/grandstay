export type RoomStatus = "Available" | "Occupied" | "Cleaning" | "Maintenance";
export type RoomType = "Single" | "Double" | "Deluxe" | "Suite" | "Penthouse";
export type BookingStatus = "Confirmed" | "CheckedIn" | "CheckedOut" | "Cancelled";

export interface Room {
  id: string;
  number: string;
  type: RoomType;
  floor: number;
  capacity: number;
  pricePerNight: number;
  status: RoomStatus;
  amenities: string[];
  description: string;
}

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  idNumber: string;
  notes: string;
  createdAt: string;
  bookingCount: number;
}

export interface Booking {
  id: string;
  reference: string;
  guestId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomId: string;
  roomNumber: string;
  roomType: RoomType;
  guestsCount: number;
  checkIn: string;
  checkOut: string;
  nights: number;
  status: BookingStatus;
  totalAmount: number;
  notes: string;
  createdAt: string;
}

export interface RevenuePoint {
  date: string;
  revenue: number;
}

export interface RoomTypeCount {
  type: RoomType;
  count: number;
}

export interface DashboardStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  cleaningRooms: number;
  maintenanceRooms: number;
  occupancyRate: number;
  arrivalsToday: number;
  departuresToday: number;
  revenueThisMonth: number;
  totalGuests: number;
  activeBookings: number;
  todaysArrivals: Booking[];
  todaysDepartures: Booking[];
  recentBookings: Booking[];
  revenueSeries: RevenuePoint[];
  roomTypes: RoomTypeCount[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export const ROOM_TYPES: RoomType[] = ["Single", "Double", "Deluxe", "Suite", "Penthouse"];
export const ROOM_STATUSES: RoomStatus[] = ["Available", "Occupied", "Cleaning", "Maintenance"];
export const BOOKING_STATUSES: BookingStatus[] = ["Confirmed", "CheckedIn", "CheckedOut", "Cancelled"];
