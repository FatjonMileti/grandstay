using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace GrandStay.Api.Models;

public enum BookingStatus
{
    Confirmed,
    CheckedIn,
    CheckedOut,
    Cancelled
}

public class Booking
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    public string Reference { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string GuestId { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string RoomId { get; set; } = string.Empty;

    public DateTime CheckIn { get; set; }

    public DateTime CheckOut { get; set; }

    public int GuestsCount { get; set; } = 1;

    [BsonRepresentation(BsonType.String)]
    public BookingStatus Status { get; set; } = BookingStatus.Confirmed;

    public decimal TotalAmount { get; set; }

    public string Notes { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
