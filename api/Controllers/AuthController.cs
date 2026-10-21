using System.Security.Claims;
using GrandStay.Api.Dtos;
using GrandStay.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace GrandStay.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly MongoDbService _db;
    private readonly JwtService _jwt;

    public AuthController(MongoDbService db, JwtService jwt)
    {
        _db = db;
        _jwt = jwt;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.Find(u => u.Email == email).FirstOrDefaultAsync();

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid email or password." });

        var dto = new UserDto(user.Id, user.Name, user.Email, user.Role);
        return Ok(new LoginResponse(_jwt.GenerateToken(user), dto));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> Me()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _db.Users.Find(u => u.Id == id).FirstOrDefaultAsync();
        if (user is null) return Unauthorized(new { message = "Account no longer exists." });
        return Ok(new UserDto(user.Id, user.Name, user.Email, user.Role));
    }
}
