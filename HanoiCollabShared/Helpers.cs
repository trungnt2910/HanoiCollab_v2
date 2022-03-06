namespace HanoiCollab
{
    public static class Helpers
    {
        public static string Truncate(this string original, int maxLength)
        {
            if (string.IsNullOrEmpty(original))
            {
                return string.Empty;
            }

            if (original.Length <= maxLength)
            {
                return original;
            }
            return original.Substring(0, maxLength - 3) + "...";

        }
    }
}
