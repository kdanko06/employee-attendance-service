export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Employee Attendance Service</h1>
        <p className="text-gray-600">API is running. Use Postman or API client to interact with endpoints.</p>
        <div className="mt-8 text-left max-w-2xl">
          <h2 className="text-xl font-semibold mb-3">Available Endpoints:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2 text-blue-600">Authentication</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>POST /api/auth/register</li>
                <li>POST /api/auth/login</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2 text-green-600">Employees (CRUD)</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>POST /api/employees - Create</li>
                <li>GET /api/employees - Read all</li>
                <li>GET /api/employees/[id] - Read one</li>
                <li>PUT /api/employees/[id] - Update</li>
                <li>DELETE /api/employees/[id] - Delete</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2 text-purple-600">Attendance</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>POST /api/attendance/sign-in</li>
                <li>POST /api/attendance/sign-off</li>
                <li>GET /api/attendance/report</li>
              </ul>
            </div>
          </div>
          <p className="mt-6 text-xs text-gray-500">
            All endpoints except auth require Bearer token authentication
          </p>
        </div>
      </div>
    </main>
  );
}
