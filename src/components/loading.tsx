export const Loading = ({
  fullScreen = false,
  className = "",
  spinnerClassName = "",
}) => {
  return (
    <div
      className={`flex items-center justify-center ${
        fullScreen ? "fixed inset-0 min-h-screen" : ""
      } ${className}`}
    >
      <div
        className={`h-12 w-12 animate-spin rounded-full border-4 border-t-4 border-gray-200 border-t-primary ${spinnerClassName}`}
      />
    </div>
  );
};
