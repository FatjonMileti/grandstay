using GrandStay.Api.Models;
using MongoDB.Driver;

namespace GrandStay.Api.Services;

public class MongoDbService
{
    private readonly IMongoDatabase _database;

    public MongoDbService(IConfiguration config)
    {
        var client = new MongoClient(config["MongoDB:ConnectionString"]);
        _database = client.GetDatabase(config["MongoDB:Database"]);
    }

    public IMongoCollection<User> Users => _database.GetCollection<User>("users");
    public IMongoCollection<Room> Rooms => _database.GetCollection<Room>("rooms");
    public IMongoCollection<Guest> Guests => _database.GetCollection<Guest>("guests");
    public IMongoCollection<Booking> Bookings => _database.GetCollection<Booking>("bookings");

    public async Task EnsureIndexesAsync()
    {
        await Users.Indexes.CreateOneAsync(
            new CreateIndexModel<User>(Builders<User>.IndexKeys.Ascending(u => u.Email),
                new CreateIndexOptions { Unique = true }));

        await Rooms.Indexes.CreateOneAsync(
            new CreateIndexModel<Room>(Builders<Room>.IndexKeys.Ascending(r => r.Number),
                new CreateIndexOptions { Unique = true }));

        await Bookings.Indexes.CreateOneAsync(
            new CreateIndexModel<Booking>(Builders<Booking>.IndexKeys.Ascending(b => b.Reference),
                new CreateIndexOptions { Unique = true }));

        await Bookings.Indexes.CreateOneAsync(
            new CreateIndexModel<Booking>(Builders<Booking>.IndexKeys
                .Ascending(b => b.RoomId)
                .Ascending(b => b.CheckIn)
                .Ascending(b => b.CheckOut)));

        await Bookings.Indexes.CreateOneAsync(
            new CreateIndexModel<Booking>(Builders<Booking>.IndexKeys.Ascending(b => b.GuestId)));
    }
}
