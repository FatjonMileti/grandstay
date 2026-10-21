using System.ComponentModel.DataAnnotations;
using GrandStay.Api.Models;

namespace GrandStay.Api.Dtos;

public record RoomDto(
    string Id,
    string Number,
    RoomType Type,
    int Floor,
    int Capacity,
    decimal PricePerNight,
    RoomStatus Status,
    List<string> Amenities,
    string Description);

public record RoomRequest(
    [Required, MaxLength(10)] string Number,
    RoomType Type,
    [Range(0, 200)] int Floor,
    [Range(1, 20)] int Capacity,
    [Range(0, 1_000_000)] decimal PricePerNight,
    RoomStatus Status,
    List<string>? Amenities,
    string? Description);

public record RoomStatusRequest(RoomStatus Status);
