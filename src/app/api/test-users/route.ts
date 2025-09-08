export async function GET() {
  const demoUsers = [
    {
      id: "1",
      email: "admin@medicare.com",
      password: "password",
      name: "Admin User",
      role: "ADMIN"
    },
    {
      id: "2", 
      email: "senior@medicare.com",
      password: "password",
      name: "Papa Singh",
      role: "SENIOR"
    },
    {
      id: "3",
      email: "family@medicare.com", 
      password: "password",
      name: "Raj Singh",
      role: "FAMILY"
    }
  ]
  
  return Response.json({ users: demoUsers })
}