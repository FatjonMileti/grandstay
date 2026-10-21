using GrandStay.Api.Dtos;
using GrandStay.Api.Models;
using GrandStay.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;

namespace GrandStay.Api.Controllers;

[ApiController]
[Route("api/rooms")]
[Authorize]
public class RoomsController : ControllerBase
{
    private readonly MongoDbService _db;

    public RoomsController(MongoDbService db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<RoomDto>>> GetAll([FromQuery] RoomStatus? status, [FromQuery] RoomType? type, [FromQuery] string? search)
    {
        var filter = Builders<Room>.Filter.Empty;

        if (status.HasValue)
            filter &= Builders<Room>.Filter.Eq(r => r.Status, status.Value);

        if (type.HasValue)
            filter &= Builders<Room>.Filter.Eq(r => r.Type, type.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var pattern = new BsonRegularExpression(System.Text.RegularExpressions.Regex.Escape(search.Trim()), "i");
            filter &= Builders<Room>.Filter.Or(
                Builders<Room>.Filter.Regex(r => r.Number, pattern),
                Builders<Room>.Filter.Regex(r => r.Description, pattern));
        }

        var rooms = await _db.Rooms.Find(filter).SortBy(r => r.Number).ToListAsync();
        return Ok(rooms.Select(r => r.ToDto()).ToList());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<RoomDto>> GetById(string id)
    {
        if (!ObjectId.TryParse(id, out _)) return NotFound();
        var room = await _db.Rooms.Find(r => r.Id == id).FirstOrDefaultAsync();
        return room is null ? NotFound() : Ok(room.ToDto());
    }

    [HttpPost]
    public async Task<ActionResult<RoomDto>> Create(RoomRequest request)
    {
        var number = request.Number.Trim();

        if (await _db.Rooms.Find(r => r.Number == number).AnyAsync())
            return BadRequest(new { message = $"Room {number} already exists." });

        var room = new Room
        {
            Number = number,
            Type = request.Type,
            Floor = request.Floor,
            Capacity = request.Capacity,
            PricePerNight = request.PricePerNight,
            Status = request.Status,
            Amenities = request.Amenities?.Where(a => !string.IsNullOrWhiteSpace(a)).Select(a => a.Trim()).Distinct().ToList() ?? new(),
            Description = request.Description?.Trim() ?? string.Empty
        };

        await _db.Rooms.InsertOneAsync(room);
        return CreatedAtAction(nameof(GetById), new { id = room.Id }, room.ToDto());
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<RoomDto>> Update(string id, RoomRequest request)
    {
        if (!ObjectId.TryParse(id, out _)) return NotFound();

        var room = await _db.Rooms.Find(r => r.Id == id).FirstOrDefaultAsync();
        if (room is null) return NotFound();

        var number = request.Number.Trim();
        if (await _db.Rooms.Find(r => r.Number == number && r.Id != id).AnyAsync())
            return BadRequest(new { message = $"Room {number} already exists." });

        room.Number = number;
        room.Type = request.Type;
        room.Floor = request.Floor;
        room.Capacity = request.Capacity;
        room.PricePerNight = request.PricePerNight;
        room.Status = request.Status;
        room.Amenities = request.Amenities?.Where(a => !string.IsNullOrWhiteSpace(a)).Select(a => a.Trim()).Distinct().ToList() ?? new();
        room.Description = request.Description?.Trim() ?? string.Empty;

        await _db.Rooms.ReplaceOneAsync(r => r.Id == id, room);
        return Ok(room.ToDto());
    }

    [HttpPatch("{id}/status")]
    public async Task<ActionResult<RoomDto>> UpdateStatus(string id, RoomStatusRequest request)
    {
        if (!ObjectId.TryParse(id, out _)) return NotFound();

        var room = await _db.Rooms.Find(r => r.Id == id).FirstOrDefaultAsync();
        if (room is null) return NotFound();

        if (request.Status == RoomStatus.Available)
        {
            var hasActiveGuest = await _db.Bookings
                .Find(b => b.RoomId == id && b.Status == BookingStatus.CheckedIn)
                .AnyAsync();

            if (hasActiveGuest)
                return BadRequest(new { message = "This room has a guest checked in. Check them out first." });
        }

        room.Status = request.Status;
        await _db.Rooms.ReplaceOneAsync(r => r.Id == id, room);
        return Ok(room.ToDto());
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        if (!ObjectId.TryParse(id, out _)) return NotFound();

        var hasBookings = await _db.Bookings
            .Find(b => b.RoomId == id && b.Status != BookingStatus.CheckedOut && b.Status != BookingStatus.Cancelled)
            .AnyAsync();

        if (hasBookings)
            return BadRequest(new { message = "This room has active bookings and cannot be deleted." });

        var result = await _db.Rooms.DeleteOneAsync(r => r.Id == id);
        return result.DeletedCount == 0 ? NotFound() : NoContent();
    }
}
