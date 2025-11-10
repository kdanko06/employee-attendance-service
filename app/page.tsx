export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Employee Attendance Service</h1>
        <p className="text-gray-600">API is running. Use Postman or API client to interact with endpoints.</p>
        <div className="mt-8 text-left max-w-md">
          <h2 className="text-xl font-semibold mb-2">Available Endpoints:</h2>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>POST /api/auth/register - Register admin</li>
            <li>POST /api/auth/login - Login admin</li>
            <li>POST /api/attendance/sign-in - Employee sign-in</li>
            <li>POST /api/attendance/sign-off - Employee sign-off</li>
            <li>GET /api/attendance/report - Get shift reports</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
