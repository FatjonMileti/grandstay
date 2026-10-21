using System.ComponentModel.DataAnnotations;
using GrandStay.Api.Models;

namespace GrandStay.Api.Dtos;

public record BookingDto(
    string Id,
    string Reference,
    string GuestId,
    string GuestName,
    string GuestEmail,
    string GuestPhone,
    string RoomId,
    string RoomNumber,
    RoomType RoomType,
    int GuestsCount,
    DateTime CheckIn,
    DateTime CheckOut,
    int Nights,
    BookingStatus Status,
    decimal TotalAmount,
    string Notes,
    DateTime CreatedAt);

public record BookingRequest(
    [Required] string GuestId,
    [Required] string RoomId,
    [Required] DateTime CheckIn,
    [Required] DateTime CheckOut,
    [Range(1, 20)] int GuestsCount,
    string? Notes);

public record BookingStatusRequest(BookingStatus Status);
