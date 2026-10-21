using GrandStay.Api.Dtos;
using GrandStay.Api.Models;

namespace GrandStay.Api.Services;

public static class Mappers
{
    public static RoomDto ToDto(this Room room) => new(
        room.Id, room.Number, room.Type, room.Floor, room.Capacity,
        room.PricePerNight, room.Status, room.Amenities, room.Description);

    public static GuestDto ToDto(this Guest guest, int bookingCount = 0) => new(
        guest.Id, guest.FirstName, guest.LastName, guest.Email, guest.Phone,
        guest.Country, guest.IdNumber, guest.Notes, guest.CreatedAt, bookingCount);

    public static BookingDto ToDto(this Booking booking, Guest? guest, Room? room)
    {
        var checkIn = booking.CheckIn.Date;
        var checkOut = booking.CheckOut.Date;
        return new BookingDto(
            booking.Id,
            booking.Reference,
            booking.GuestId,
            guest?.FullName ?? "Deleted guest",
            guest?.Email ?? string.Empty,
            guest?.Phone ?? string.Empty,
            booking.RoomId,
            room?.Number ?? "—",
            room?.Type ?? RoomType.Double,
            booking.GuestsCount,
            booking.CheckIn,
            booking.CheckOut,
            Math.Max(1, (int)(checkOut - checkIn).TotalDays),
            booking.Status,
            booking.TotalAmount,
            booking.Notes,
            booking.CreatedAt);
    }
}
