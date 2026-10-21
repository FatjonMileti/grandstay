using GrandStay.Api.Dtos;
using GrandStay.Api.Models;
using GrandStay.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;

namespace GrandStay.Api.Controllers;

[ApiController]
[Route("api/guests")]
[Authorize]
public class GuestsController : ControllerBase
{
    private readonly MongoDbService _db;

    public GuestsController(MongoDbService db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<GuestDto>>> GetAll([FromQuery] string? search)
    {
        var filter = Builders<Guest>.Filter.Empty;

        if (!string.IsNullOrWhiteSpace(search))
        {
            var pattern = new BsonRegularExpression(System.Text.RegularExpressions.Regex.Escape(search.Trim()), "i");
            filter &= Builders<Guest>.Filter.Or(
                Builders<Guest>.Filter.Regex(g => g.FirstName, pattern),
                Builders<Guest>.Filter.Regex(g => g.LastName, pattern),
                Builders<Guest>.Filter.Regex(g => g.Email, pattern),
                Builders<Guest>.Filter.Regex(g => g.Phone, pattern),
                Builders<Guest>.Filter.Regex(g => g.Country, pattern));
        }

        var guests = await _db.Guests.Find(filter).SortBy(g => g.FirstName).ThenBy(g => g.LastName).ToListAsync();

        var ids = guests.Select(g => g.Id).ToList();
        var bookings = ids.Count == 0
            ? new List<Booking>()
            : await _db.Bookings.Find(Builders<Booking>.Filter.In(b => b.GuestId, ids)).ToListAsync();

        var counts = bookings.GroupBy(b => b.GuestId).ToDictionary(g => g.Key, g => g.Count());

        return Ok(guests.Select(g => g.ToDto(counts.GetValueOrDefault(g.Id))).ToList());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<GuestDto>> GetById(string id)
    {
        if (!ObjectId.TryParse(id, out _)) return NotFound();

        var guest = await _db.Guests.Find(g => g.Id == id).FirstOrDefaultAsync();
        if (guest is null) return NotFound();

        var count = (int)await _db.Bookings.CountDocumentsAsync(b => b.GuestId == id);
        return Ok(guest.ToDto(count));
    }

    [HttpPost]
    public async Task<ActionResult<GuestDto>> Create(GuestRequest request)
    {
        var guest = new Guest
        {
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = request.Email?.Trim().ToLowerInvariant() ?? string.Empty,
            Phone = request.Phone?.Trim() ?? string.Empty,
            Country = request.Country?.Trim() ?? string.Empty,
            IdNumber = request.IdNumber?.Trim() ?? string.Empty,
            Notes = request.Notes?.Trim() ?? string.Empty
        };

        await _db.Guests.InsertOneAsync(guest);
        return CreatedAtAction(nameof(GetById), new { id = guest.Id }, guest.ToDto());
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<GuestDto>> Update(string id, GuestRequest request)
    {
        if (!ObjectId.TryParse(id, out _)) return NotFound();

        var guest = await _db.Guests.Find(g => g.Id == id).FirstOrDefaultAsync();
        if (guest is null) return NotFound();

        guest.FirstName = request.FirstName.Trim();
        guest.LastName = request.LastName.Trim();
        guest.Email = request.Email?.Trim().ToLowerInvariant() ?? string.Empty;
        guest.Phone = request.Phone?.Trim() ?? string.Empty;
        guest.Country = request.Country?.Trim() ?? string.Empty;
        guest.IdNumber = request.IdNumber?.Trim() ?? string.Empty;
        guest.Notes = request.Notes?.Trim() ?? string.Empty;

        await _db.Guests.ReplaceOneAsync(g => g.Id == id, guest);

        var count = (int)await _db.Bookings.CountDocumentsAsync(b => b.GuestId == id);
        return Ok(guest.ToDto(count));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        if (!ObjectId.TryParse(id, out _)) return NotFound();

        var hasBookings = await _db.Bookings.Find(b => b.GuestId == id).AnyAsync();
        if (hasBookings)
            return BadRequest(new { message = "This guest has booking history and cannot be deleted." });

        var result = await _db.Guests.DeleteOneAsync(g => g.Id == id);
        return result.DeletedCount == 0 ? NotFound() : NoContent();
    }
}
