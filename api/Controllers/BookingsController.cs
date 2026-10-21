using GrandStay.Api.Dtos;
using GrandStay.Api.Models;
using GrandStay.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;

namespace GrandStay.Api.Controllers;

[ApiController]
[Route("api/bookings")]
[Authorize]
public class BookingsController : ControllerBase
{
    private readonly MongoDbService _db;
    private readonly BookingService _bookings;

    public BookingsController(MongoDbService db, BookingService bookings)
    {
        _db = db;
        _bookings = bookings;
    }

    [HttpGet]
    public async Task<ActionResult<List<BookingDto>>> GetAll(
        [FromQuery] BookingStatus? status,
        [FromQuery] string? search,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        var filter = Builders<Booking>.Filter.Empty;

        if (status.HasValue)
            filter &= Builders<Booking>.Filter.Eq(b => b.Status, status.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            var pattern = new BsonRegularExpression(System.Text.RegularExpressions.Regex.Escape(term), "i");

            var guestIds = await _db.Guests
                .Find(Builders<Guest>.Filter.Or(
                    Builders<Guest>.Filter.Regex(g => g.FirstName, pattern),
                    Builders<Guest>.Filter.Regex(g => g.LastName, pattern),
                    Builders<Guest>.Filter.Regex(g => g.Email, pattern),
                    Builders<Guest>.Filter.Regex(g => g.Phone, pattern)))
                .Project(g => g.Id)
                .ToListAsync();

            var roomIds = await _db.Rooms
                .Find(Builders<Room>.Filter.Regex(r => r.Number, pattern))
                .Project(r => r.Id)
                .ToListAsync();

            var clauses = new List<FilterDefinition<Booking>>
            {
                Builders<Booking>.Filter.Regex(b => b.Reference, pattern)
            };

            if (guestIds.Count > 0) clauses.Add(Builders<Booking>.Filter.In(b => b.GuestId, guestIds));
            if (roomIds.Count > 0) clauses.Add(Builders<Booking>.Filter.In(b => b.RoomId, roomIds));

            filter &= Builders<Booking>.Filter.Or(clauses);
        }

        if (from.HasValue)
            filter &= Builders<Booking>.Filter.Gt(b => b.CheckOut, from.Value.Date);

        if (to.HasValue)
            filter &= Builders<Booking>.Filter.Lt(b => b.CheckIn, to.Value.Date.AddDays(1));

        var bookings = await _db.Bookings.Find(filter)
            .SortByDescending(b => b.CheckIn)
            .ThenByDescending(b => b.CreatedAt)
            .ToListAsync();

        return Ok(await _bookings.ToDtosAsync(bookings));
    }

    [HttpGet("availability")]
    public async Task<ActionResult<List<RoomDto>>> Availability(
        [FromQuery] DateTime checkIn,
        [FromQuery] DateTime checkOut,
        [FromQuery] int guests = 1,
        [FromQuery] string? excludeBookingId = null)
    {
        var start = BookingService.Normalize(checkIn);
        var end = BookingService.Normalize(checkOut);

        if (end <= start)
            return BadRequest(new { message = "Check-out must be after check-in." });

        var rooms = await _db.Rooms.Find(r =>
                r.Status != RoomStatus.Maintenance && r.Capacity >= guests)
            .SortBy(r => r.Number)
            .ToListAsync();

        var overlapFilter = Builders<Booking>.Filter.And(
            Builders<Booking>.Filter.Ne(b => b.Status, BookingStatus.Cancelled),
            Builders<Booking>.Filter.Lt(b => b.CheckIn, end),
            Builders<Booking>.Filter.Gt(b => b.CheckOut, start));

        if (!string.IsNullOrWhiteSpace(excludeBookingId))
            overlapFilter &= Builders<Booking>.Filter.Ne(b => b.Id, excludeBookingId);

        var bookedIds = await _db.Bookings
            .Find(overlapFilter)
            .Project(b => b.RoomId)
            .ToListAsync();

        var booked = bookedIds.ToHashSet();
        return Ok(rooms.Where(r => !booked.Contains(r.Id)).Select(r => r.ToDto()).ToList());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<BookingDto>> GetById(string id)
    {
        if (!ObjectId.TryParse(id, out _)) return NotFound();
        var dto = await _bookings.GetDtoAsync(id);
        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<BookingDto>> Create(BookingRequest request)
    {
        var (room, _) = await _bookings.ValidateAsync(request);

        var checkIn = BookingService.Normalize(request.CheckIn);
        var checkOut = BookingService.Normalize(request.CheckOut);
        var nights = (int)(checkOut - checkIn).TotalDays;

        var booking = new Booking
        {
            Reference = $"GS-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}",
            GuestId = request.GuestId,
            RoomId = room.Id,
            CheckIn = checkIn,
            CheckOut = checkOut,
            GuestsCount = request.GuestsCount,
            Status = BookingStatus.Confirmed,
            TotalAmount = nights * room.PricePerNight,
            Notes = request.Notes?.Trim() ?? string.Empty
        };

        await _db.Bookings.InsertOneAsync(booking);
        var dto = await _bookings.GetDtoAsync(booking.Id);
        return CreatedAtAction(nameof(GetById), new { id = booking.Id }, dto);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<BookingDto>> Update(string id, BookingRequest request)
    {
        if (!ObjectId.TryParse(id, out _)) return NotFound();

        var booking = await _db.Bookings.Find(b => b.Id == id).FirstOrDefaultAsync();
        if (booking is null) return NotFound();

        if (booking.Status != BookingStatus.Confirmed)
            return BadRequest(new { message = "Only confirmed bookings can be modified." });

        var (room, _) = await _bookings.ValidateAsync(request, id);

        var checkIn = BookingService.Normalize(request.CheckIn);
        var checkOut = BookingService.Normalize(request.CheckOut);
        var nights = (int)(checkOut - checkIn).TotalDays;

        booking.GuestId = request.GuestId;
        booking.RoomId = room.Id;
        booking.CheckIn = checkIn;
        booking.CheckOut = checkOut;
        booking.GuestsCount = request.GuestsCount;
        booking.TotalAmount = nights * room.PricePerNight;
        booking.Notes = request.Notes?.Trim() ?? string.Empty;
        booking.UpdatedAt = DateTime.UtcNow;

        await _db.Bookings.ReplaceOneAsync(b => b.Id == id, booking);
        return Ok(await _bookings.GetDtoAsync(id));
    }

    [HttpPatch("{id}/status")]
    public async Task<ActionResult<BookingDto>> UpdateStatus(string id, BookingStatusRequest request)
    {
        if (!ObjectId.TryParse(id, out _)) return NotFound();

        var booking = await _db.Bookings.Find(b => b.Id == id).FirstOrDefaultAsync();
        if (booking is null) return NotFound();

        var room = await _db.Rooms.Find(r => r.Id == booking.RoomId).FirstOrDefaultAsync();
        if (room is null) return BadRequest(new { message = "The room for this booking no longer exists." });

        switch (booking.Status, request.Status)
        {
            case (BookingStatus.Confirmed, BookingStatus.CheckedIn):
                if (DateTime.UtcNow.Date < booking.CheckIn.Date)
                    return BadRequest(new { message = $"Check-in opens on {booking.CheckIn:MMM d, yyyy}." });
                booking.Status = BookingStatus.CheckedIn;
                room.Status = RoomStatus.Occupied;
                break;

            case (BookingStatus.Confirmed, BookingStatus.Cancelled):
                booking.Status = BookingStatus.Cancelled;
                break;

            case (BookingStatus.CheckedIn, BookingStatus.CheckedOut):
                booking.Status = BookingStatus.CheckedOut;
                room.Status = RoomStatus.Cleaning;
                break;

            case var (current, next) when current == next:
                break;

            default:
                return BadRequest(new { message = $"Cannot change a {booking.Status} booking to {request.Status}." });
        }

        booking.UpdatedAt = DateTime.UtcNow;
        await _db.Bookings.ReplaceOneAsync(b => b.Id == id, booking);
        await _db.Rooms.ReplaceOneAsync(r => r.Id == room.Id, room);

        return Ok(await _bookings.GetDtoAsync(id));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        if (!ObjectId.TryParse(id, out _)) return NotFound();

        var booking = await _db.Bookings.Find(b => b.Id == id).FirstOrDefaultAsync();
        if (booking is null) return NotFound();

        if (booking.Status != BookingStatus.Cancelled)
            return BadRequest(new { message = "Only cancelled bookings can be deleted." });

        await _db.Bookings.DeleteOneAsync(b => b.Id == id);
        return NoContent();
    }
}
