using GrandStay.Api.Models;
using MongoDB.Driver;

namespace GrandStay.Api.Services;

public static class DataSeeder
{
    public static async Task SeedAsync(MongoDbService db)
    {
        await SeedUsersAsync(db);
        await SeedRoomsAsync(db);
        await SeedGuestsAsync(db);
        await SeedBookingsAsync(db);
    }

    private static async Task SeedUsersAsync(MongoDbService db)
    {
        if (await db.Users.CountDocumentsAsync(FilterDefinition<User>.Empty) > 0) return;

        var users = new List<User>
        {
            new()
            {
                Name = "Amara Okafor",
                Email = "admin@grandstay.com",
                Role = "Admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123")
            },
            new()
            {
                Name = "Daniel Reyes",
                Email = "manager@grandstay.com",
                Role = "Manager",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("manager123")
            },
            new()
            {
                Name = "Sofia Lindqvist",
                Email = "frontdesk@grandstay.com",
                Role = "Receptionist",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("frontdesk123")
            }
        };

        await db.Users.InsertManyAsync(users);
    }

    private static async Task SeedRoomsAsync(MongoDbService db)
    {
        if (await db.Rooms.CountDocumentsAsync(FilterDefinition<Room>.Empty) > 0) return;

        var rooms = new List<Room>
        {
            Room("101", RoomType.Single, 1, 1, 89, RoomStatus.Cleaning,
                new[] { "Free Wi-Fi", "Smart TV", "Coffee maker", "City view" },
                "A snug single retreat with a queen bed and a writing desk."),
            Room("102", RoomType.Double, 1, 2, 129, RoomStatus.Available,
                new[] { "Free Wi-Fi", "Smart TV", "Minibar", "Garden view" },
                "Classic double room opening onto the courtyard garden."),
            Room("103", RoomType.Double, 1, 2, 129, RoomStatus.Occupied,
                new[] { "Free Wi-Fi", "Smart TV", "Rain shower" },
                "Warm timber interiors with a plush king bed."),
            Room("104", RoomType.Deluxe, 1, 3, 179, RoomStatus.Occupied,
                new[] { "Free Wi-Fi", "Smart TV", "Bathtub", "Lounge chair", "Minibar" },
                "Deluxe room with a separate seating corner and marble bath."),
            Room("105", RoomType.Single, 1, 1, 95, RoomStatus.Available,
                new[] { "Free Wi-Fi", "Smart TV", "Work desk" },
                "Quiet single room at the end of the garden corridor."),
            Room("201", RoomType.Double, 2, 2, 139, RoomStatus.Available,
                new[] { "Free Wi-Fi", "Smart TV", "Balcony", "Coffee maker" },
                "South-facing double with a private balcony."),
            Room("202", RoomType.Deluxe, 2, 3, 189, RoomStatus.Available,
                new[] { "Free Wi-Fi", "Smart TV", "Bathtub", "Minibar", "Balcony" },
                "Deluxe corner room with panoramic balcony views."),
            Room("203", RoomType.Suite, 2, 3, 279, RoomStatus.Occupied,
                new[] { "Free Wi-Fi", "Smart TV", "Lounge", "Bathtub", "Butler service" },
                "One-bedroom suite with a separate living room."),
            Room("204", RoomType.Suite, 2, 3, 279, RoomStatus.Cleaning,
                new[] { "Free Wi-Fi", "Smart TV", "Lounge", "Bathtub", "City view" },
                "Suite with deep-soaking tub and evening turndown."),
            Room("205", RoomType.Double, 2, 2, 145, RoomStatus.Available,
                new[] { "Free Wi-Fi", "Smart TV", "Coffee maker" },
                "Double room overlooking the olive terrace."),
            Room("206", RoomType.Deluxe, 2, 4, 219, RoomStatus.Available,
                new[] { "Free Wi-Fi", "Smart TV", "Sofa bed", "Minibar", "Family friendly" },
                "Spacious family deluxe with a sofa bed for two children."),
            Room("301", RoomType.Suite, 3, 4, 349, RoomStatus.Occupied,
                new[] { "Free Wi-Fi", "Smart TV", "Lounge", "Dining table", "Butler service", "Balcony" },
                "Executive suite with dining area and skyline views."),
            Room("302", RoomType.Deluxe, 3, 2, 199, RoomStatus.Cleaning,
                new[] { "Free Wi-Fi", "Smart TV", "Bathtub", "Minibar" },
                "Deluxe room with handcrafted furnishings."),
            Room("303", RoomType.Deluxe, 3, 2, 199, RoomStatus.Available,
                new[] { "Free Wi-Fi", "Smart TV", "Balcony", "Rain shower" },
                "Bright deluxe room with a Juliet balcony."),
            Room("401", RoomType.Penthouse, 4, 4, 599, RoomStatus.Available,
                new[] { "Free Wi-Fi", "Smart TV", "Private terrace", "Jacuzzi", "Butler service", "Kitchenette" },
                "Rooftop penthouse with a wraparound terrace and jacuzzi."),
            Room("402", RoomType.Penthouse, 4, 4, 649, RoomStatus.Maintenance,
                new[] { "Free Wi-Fi", "Smart TV", "Private terrace", "Jacuzzi", "Fireplace", "Butler service" },
                "Our signature penthouse, temporarily closed for refurbishment.")
        };

        await db.Rooms.InsertManyAsync(rooms);
    }

    private static Room Room(string number, RoomType type, int floor, int capacity,
        decimal price, RoomStatus status, string[] amenities, string description) => new()
    {
        Number = number,
        Type = type,
        Floor = floor,
        Capacity = capacity,
        PricePerNight = price,
        Status = status,
        Amenities = amenities.ToList(),
        Description = description
    };

    private static async Task SeedGuestsAsync(MongoDbService db)
    {
        if (await db.Guests.CountDocumentsAsync(FilterDefinition<Guest>.Empty) > 0) return;

        var guests = new List<Guest>
        {
            new() { FirstName = "Elena", LastName = "Rossi", Email = "elena.rossi@example.com", Phone = "+39 340 555 0182", Country = "Italy", IdNumber = "IT-YA1234567", Notes = "Prefers a high floor and feather-free pillows." },
            new() { FirstName = "James", LastName = "Whitfield", Email = "j.whitfield@example.com", Phone = "+44 7700 900112", Country = "United Kingdom", IdNumber = "UK-PA9911234", Notes = "Repeat guest — always books a suite." },
            new() { FirstName = "Yuki", LastName = "Tanaka", Email = "yuki.tanaka@example.com", Phone = "+81 90 1234 5678", Country = "Japan", IdNumber = "JP-TK778812", Notes = "Requests green tea on arrival." },
            new() { FirstName = "Marcus", LastName = "Johnson", Email = "marcus.j@example.com", Phone = "+1 415 555 0134", Country = "United States", IdNumber = "US-CA0098123", Notes = "Corporate account — Vertex Labs." },
            new() { FirstName = "Aisha", LastName = "Bello", Email = "aisha.bello@example.com", Phone = "+234 802 555 7710", Country = "Nigeria", IdNumber = "NG-AB221190", Notes = "Celebrating an anniversary in October." },
            new() { FirstName = "Lucas", LastName = "Moreau", Email = "lucas.moreau@example.com", Phone = "+33 6 12 34 56 78", Country = "France", IdNumber = "FR-LM889021", Notes = "Travels with a small dog (pre-approved)." },
            new() { FirstName = "Priya", LastName = "Sharma", Email = "priya.sharma@example.com", Phone = "+91 98765 43210", Country = "India", IdNumber = "IN-PS441267", Notes = "Vegetarian breakfast, no nuts." },
            new() { FirstName = "Noah", LastName = "Fischer", Email = "noah.fischer@example.com", Phone = "+49 151 2345 6789", Country = "Germany", IdNumber = "DE-NF556712", Notes = "Early check-in requested when available." }
        };

        await db.Guests.InsertManyAsync(guests);
    }

    private static async Task SeedBookingsAsync(MongoDbService db)
    {
        if (await db.Bookings.CountDocumentsAsync(FilterDefinition<Booking>.Empty) > 0) return;

        var rooms = await db.Rooms.Find(FilterDefinition<Room>.Empty).ToListAsync();
        var guests = await db.Guests.Find(FilterDefinition<Guest>.Empty).ToListAsync();
        var today = DateTime.UtcNow.Date;

        Room R(string number) => rooms.First(r => r.Number == number);
        Guest G(int index) => guests[index];

        var seeds = new (int guest, string room, int inOffset, int nights, BookingStatus status, int createdDaysAgo)[]
        {
            (0, "102", 0, 3, BookingStatus.Confirmed, 2),
            (1, "201", 0, 2, BookingStatus.Confirmed, 1),
            (2, "203", -2, 3, BookingStatus.CheckedIn, 0),
            (3, "301", -3, 3, BookingStatus.CheckedIn, 4),
            (4, "104", -1, 3, BookingStatus.CheckedIn, 3),
            (5, "202", 3, 3, BookingStatus.Confirmed, 2),
            (6, "204", -6, 3, BookingStatus.CheckedOut, 5),
            (7, "302", -10, 3, BookingStatus.CheckedOut, 9),
            (0, "303", 7, 2, BookingStatus.Confirmed, 1),
            (1, "401", 10, 4, BookingStatus.Confirmed, 6),
            (5, "103", -1, 2, BookingStatus.CheckedIn, 2),
            (2, "205", -15, 3, BookingStatus.CheckedOut, 12),
            (3, "105", 1, 2, BookingStatus.Confirmed, 0),
            (4, "206", 0, 4, BookingStatus.Confirmed, 0),
            (6, "101", -20, 2, BookingStatus.CheckedOut, 13)
        };

        var bookings = seeds.Select(s =>
        {
            var room = R(s.room);
            var checkIn = today.AddDays(s.inOffset);
            var checkOut = checkIn.AddDays(s.nights);
            return new Booking
            {
                Reference = $"GS-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}",
                GuestId = G(s.guest).Id,
                RoomId = room.Id,
                CheckIn = checkIn,
                CheckOut = checkOut,
                GuestsCount = Math.Min(room.Capacity, 2),
                Status = s.status,
                TotalAmount = s.nights * room.PricePerNight,
                Notes = string.Empty,
                CreatedAt = DateTime.UtcNow.AddDays(-s.createdDaysAgo).AddHours(-2),
                UpdatedAt = DateTime.UtcNow.AddDays(-s.createdDaysAgo).AddHours(-2)
            };
        }).ToList();

        await db.Bookings.InsertManyAsync(bookings);
    }
}
