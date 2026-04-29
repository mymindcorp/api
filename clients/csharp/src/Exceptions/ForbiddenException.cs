using MyMind.Models;

namespace MyMind.Exceptions;

public class ForbiddenException : ApiException
{
    public ForbiddenException(Problem problem) : base(403, problem) { }
}
