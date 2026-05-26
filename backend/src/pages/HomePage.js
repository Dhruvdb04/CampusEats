import { Link } from "react-router-dom"
import { GraduationCap } from "lucide-react"

const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-10 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-3 rounded-full">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">CampusEats</h1>
          <p className="text-gray-500 mb-8">Delicious food at your convenience</p>

          <div className="space-y-4">
            <Link
              to="/signup"
              className="w-full block text-center bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300 shadow-md font-medium"
            >
              Create an Account
            </Link>
            <Link
              to="/login"
              className="w-full block text-center bg-white text-blue-600 border-2 border-blue-600 py-3 px-4 rounded-lg hover:bg-blue-50 transition duration-300 font-medium"
            >
              Login to Your Account
            </Link>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500 mt-8">
          <p>© {new Date().getFullYear()} CampusEats. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

export default HomePage

