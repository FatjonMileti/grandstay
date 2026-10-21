using System.ComponentModel.DataAnnotations;

namespace GrandStay.Api.Dtos;

public record GuestDto(
    string Id,
    string FirstName,
    string LastName,
    string Email,
    string Phone,
    string Country,
    string IdNumber,
    string Notes,
    DateTime CreatedAt,
    int BookingCount = 0);

public record GuestRequest(
    [Required, MaxLength(80)] string FirstName,
    [Required, MaxLength(80)] string LastName,
    [EmailAddress, MaxLength(160)] string? Email,
    [MaxLength(40)] string? Phone,
    [MaxLength(80)] string? Country,
    [MaxLength(60)] string? IdNumber,
    [MaxLength(500)] string? Notes);
