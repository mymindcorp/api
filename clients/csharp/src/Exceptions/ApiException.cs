using MyMind.Models;

namespace MyMind.Exceptions;

public class ApiException : Exception
{
    public int Status { get; }
    public Problem Problem { get; }

    public ApiException(int status, Problem problem)
        : base(problem.Detail ?? problem.Title)
    {
        Status = status;
        Problem = problem;
    }
}
