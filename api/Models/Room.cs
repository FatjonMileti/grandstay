using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace GrandStay.Api.Models;

public enum RoomStatus
{
    Available,
    Occupied,
    Cleaning,
    Maintenance
}

public enum RoomType
{
    Single,
    Double,
    Deluxe,
    Suite,
    Penthouse
}

public class Room
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    public string Number { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.String)]
    public RoomType Type { get; set; } = RoomType.Double;

    public int Floor { get; set; }

    public int Capacity { get; set; } = 2;

    public decimal PricePerNight { get; set; }

    [BsonRepresentation(BsonType.String)]
    public RoomStatus Status { get; set; } = RoomStatus.Available;

    public List<string> Amenities { get; set; } = new();

    public string Description { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
