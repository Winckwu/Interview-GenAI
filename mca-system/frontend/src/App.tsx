import { useState } from 'react'

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-gray-900">
            MCA System - Meta-Cognitive Assessment Platform
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Statistics Cards */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-4xl font-bold text-blue-600 mb-2">143</div>
            <p className="text-gray-600 text-lg">User Frustrations</p>
            <p className="text-gray-500 text-sm mt-2">
              Comprehensive catalog from 49 interviews
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-4xl font-bold text-green-600 mb-2">87</div>
            <p className="text-gray-600 text-lg">Alternative Strategies</p>
            <p className="text-gray-500 text-sm mt-2">
              Evidence-based solutions for common issues
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-4xl font-bold text-purple-600 mb-2">20</div>
            <p className="text-gray-600 text-lg">Meta-Requirements</p>
            <p className="text-gray-500 text-sm mt-2">
              Key requirements for optimal AI utilization
            </p>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome to MCA System
          </h2>
          <p className="text-gray-600 mb-6">
            The Meta-Cognitive Assessment Platform helps you optimize your AI usage patterns
            by identifying frustrations, providing alternative strategies, and tracking your
            meta-cognitive skills.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">📊 Track Usage Patterns</h3>
              <p className="text-gray-600 text-sm">
                Monitor your AI interaction patterns and identify areas for improvement.
              </p>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">💡 Discover Strategies</h3>
              <p className="text-gray-600 text-sm">
                Explore evidence-based strategies to overcome common frustrations.
              </p>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">🎯 Assess Skills</h3>
              <p className="text-gray-600 text-sm">
                Complete comprehensive meta-cognitive assessments tailored to your needs.
              </p>
            </div>

            <div className="border-l-4 border-orange-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">📈 Monitor Progress</h3>
              <p className="text-gray-600 text-sm">
                Track improvements over time with detailed analytics and insights.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Counter */}
        <div className="bg-white rounded-lg shadow-md p-8 mt-12 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            React + TypeScript Counter
          </h2>
          <div className="text-6xl font-bold text-blue-600 mb-4">
            {count}
          </div>
          <button
            onClick={() => setCount((count) => count + 1)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
          >
            Click me
          </button>
        </div>
      </main>
    </div>
  )
}
