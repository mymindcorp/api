using MyMind.Models;

namespace MyMind.Exceptions;

public class InvalidRequestException : ApiException
{
    public InvalidRequestException(Problem problem) : base(400, problem) { }
}
