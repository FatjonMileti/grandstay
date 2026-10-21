using GrandStay.Api.Models;

namespace GrandStay.Api.Dtos;

public record RevenuePoint(string Date, decimal Revenue);

public record RoomTypeCount(RoomType Type, int Count);

public record DashboardStats(
    int TotalRooms,
    int AvailableRooms,
    int OccupiedRooms,
    int CleaningRooms,
    int MaintenanceRooms,
    double OccupancyRate,
    int ArrivalsToday,
    int DeparturesToday,
    decimal RevenueThisMonth,
    int TotalGuests,
    int ActiveBookings,
    List<BookingDto> TodaysArrivals,
    List<BookingDto> TodaysDepartures,
    List<BookingDto> RecentBookings,
    List<RevenuePoint> RevenueSeries,
    List<RoomTypeCount> RoomTypes);
