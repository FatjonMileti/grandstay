using GrandStay.Api.Dtos;
using GrandStay.Api.Models;
using MongoDB.Bson;
using MongoDB.Driver;

namespace GrandStay.Api.Services;

public class BookingService
{
    private readonly MongoDbService _db;

    public BookingService(MongoDbService db)
    {
        _db = db;
    }

    public static DateTime Normalize(DateTime value) =>
        DateTime.SpecifyKind(value.Date, DateTimeKind.Utc);

    public async Task<List<BookingDto>> ToDtosAsync(IEnumerable<Booking> bookings)
    {
        var list = bookings.ToList();
        var guestIds = list.Select(b => b.GuestId).Distinct().ToList();
        var roomIds = list.Select(b => b.RoomId).Distinct().ToList();

        var guests = guestIds.Count == 0
            ? new List<Guest>()
            : await _db.Guests.Find(Builders<Guest>.Filter.In(g => g.Id, guestIds)).ToListAsync();

        var rooms = roomIds.Count == 0
            ? new List<Room>()
            : await _db.Rooms.Find(Builders<Room>.Filter.In(r => r.Id, roomIds)).ToListAsync();

        var guestMap = guests.ToDictionary(g => g.Id);
        var roomMap = rooms.ToDictionary(r => r.Id);

        return list
            .Select(b => b.ToDto(guestMap.GetValueOrDefault(b.GuestId), roomMap.GetValueOrDefault(b.RoomId)))
            .ToList();
    }

    public async Task<BookingDto?> GetDtoAsync(string id)
    {
        var booking = await _db.Bookings.Find(b => b.Id == id).FirstOrDefaultAsync();
        if (booking is null) return null;
        return (await ToDtosAsync(new[] { booking })).First();
    }

    public async Task<(Room Room, Guest Guest)> ValidateAsync(BookingRequest req, string? excludeBookingId = null)
    {
        if (!ObjectId.TryParse(req.GuestId, out _) || !ObjectId.TryParse(req.RoomId, out _))
            throw new InvalidOperationException("Select a valid guest and room.");

        var guest = await _db.Guests.Find(g => g.Id == req.GuestId).FirstOrDefaultAsync()
            ?? throw new InvalidOperationException("Guest not found.");

        var room = await _db.Rooms.Find(r => r.Id == req.RoomId).FirstOrDefaultAsync()
            ?? throw new InvalidOperationException("Room not found.");

        var checkIn = Normalize(req.CheckIn);
        var checkOut = Normalize(req.CheckOut);

        if (checkOut <= checkIn)
            throw new InvalidOperationException("Check-out must be after check-in.");

        if (checkIn < DateTime.UtcNow.Date)
            throw new InvalidOperationException("Check-in cannot be in the past.");

        if (req.GuestsCount < 1 || req.GuestsCount > room.Capacity)
            throw new InvalidOperationException($"This room accommodates up to {room.Capacity} guest(s).");

        if (room.Status == RoomStatus.Maintenance)
            throw new InvalidOperationException($"Room {room.Number} is under maintenance.");

        var filter = Builders<Booking>.Filter.And(
            Builders<Booking>.Filter.Eq(b => b.RoomId, req.RoomId),
            Builders<Booking>.Filter.Ne(b => b.Status, BookingStatus.Cancelled),
            Builders<Booking>.Filter.Lt(b => b.CheckIn, checkOut),
            Builders<Booking>.Filter.Gt(b => b.CheckOut, checkIn));

        if (!string.IsNullOrWhiteSpace(excludeBookingId))
            filter &= Builders<Booking>.Filter.Ne(b => b.Id, excludeBookingId);

        if (await _db.Bookings.CountDocumentsAsync(filter) > 0)
            throw new InvalidOperationException($"Room {room.Number} is already booked for the selected dates.");

        return (room, guest);
    }
}
