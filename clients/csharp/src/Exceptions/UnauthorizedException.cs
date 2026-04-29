using MyMind.Models;

namespace MyMind.Exceptions;

public class UnauthorizedException : ApiException
{
    public UnauthorizedException(Problem problem) : base(401, problem) { }
}
