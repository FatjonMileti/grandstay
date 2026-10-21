using System.ComponentModel.DataAnnotations;

namespace GrandStay.Api.Dtos;

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required, MinLength(4)] string Password);

public record UserDto(string Id, string Name, string Email, string Role);

public record LoginResponse(string Token, UserDto User);
