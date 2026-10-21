using GrandStay.Api.Dtos;
using GrandStay.Api.Models;
using GrandStay.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace GrandStay.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly MongoDbService _db;
    private readonly BookingService _bookings;

    public DashboardController(MongoDbService db, BookingService bookings)
    {
        _db = db;
        _bookings = bookings;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStats>> Stats()
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);
        var monthStart = new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var seriesStart = today.AddDays(-13);

        var rooms = await _db.Rooms.Find(FilterDefinition<Room>.Empty).ToListAsync();

        var arrivals = await _db.Bookings
            .Find(b => b.CheckIn == today && b.Status == BookingStatus.Confirmed)
            .SortBy(b => b.CheckIn)
            .ToListAsync();

        var departures = await _db.Bookings
            .Find(b => b.CheckOut == today && b.Status == BookingStatus.CheckedIn)
            .ToListAsync();

        var recent = await _db.Bookings.Find(FilterDefinition<Booking>.Empty)
            .SortByDescending(b => b.CreatedAt)
            .Limit(6)
            .ToListAsync();

        var activeBookings = (int)await _db.Bookings.CountDocumentsAsync(
            b => b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.CheckedIn);

        var totalGuests = (int)await _db.Guests.CountDocumentsAsync(FilterDefinition<Guest>.Empty);

        var revenueSource = await _db.Bookings.Find(
                b => b.CreatedAt >= (monthStart < seriesStart ? monthStart : seriesStart)
                     && b.Status != BookingStatus.Cancelled)
            .ToListAsync();

        var revenueThisMonth = revenueSource
            .Where(b => b.CreatedAt >= monthStart)
            .Sum(b => b.TotalAmount);

        var series = new List<RevenuePoint>();
        for (var day = seriesStart; day <= today; day = day.AddDays(1))
        {
            var total = revenueSource
                .Where(b => b.CreatedAt.Date == day)
                .Sum(b => b.TotalAmount);
            series.Add(new RevenuePoint(day.ToString("yyyy-MM-dd"), total));
        }

        var occupied = rooms.Count(r => r.Status == RoomStatus.Occupied);
        var totalRooms = rooms.Count;

        var arrivalsDtos = await _bookings.ToDtosAsync(arrivals.Take(6));
        var departuresDtos = await _bookings.ToDtosAsync(departures.Take(6));
        var recentDtos = await _bookings.ToDtosAsync(recent);

        var stats = new DashboardStats(
            totalRooms,
            rooms.Count(r => r.Status == RoomStatus.Available),
            occupied,
            rooms.Count(r => r.Status == RoomStatus.Cleaning),
            rooms.Count(r => r.Status == RoomStatus.Maintenance),
            totalRooms == 0 ? 0 : Math.Round(occupied * 100.0 / totalRooms, 1),
            arrivals.Count,
            departures.Count,
            revenueThisMonth,
            totalGuests,
            activeBookings,
            arrivalsDtos,
            departuresDtos,
            recentDtos,
            series,
            rooms.GroupBy(r => r.Type)
                .OrderBy(g => g.Key)
                .Select(g => new RoomTypeCount(g.Key, g.Count()))
                .ToList());

        return Ok(stats);
    }
}
