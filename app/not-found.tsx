"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <section className="bg-white dark:bg-gray-900 min-h-screen flex items-center">
      <div className="container px-6 py-12 mx-auto lg:flex lg:items-center lg:gap-12">
        
        {/* LEFT SIDE */}
        <div className="w-full lg:w-1/2">
          <p className="text-sm font-medium text-blue-500 dark:text-blue-400">
            404 error
          </p>

          <h1 className="mt-3 text-2xl font-semibold text-gray-800 dark:text-white md:text-3xl">
            Page not found
          </h1>

          <p className="mt-4 text-gray-500 dark:text-gray-400">
            Sorry, the page you are looking for doesn't exist.
            Here are some helpful links:
          </p>

          <div className="flex items-center mt-6 gap-x-3">
            
            {/* GO BACK */}
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center px-5 py-2 text-sm text-gray-700 transition-colors duration-200 bg-white border rounded-lg gap-x-2 hover:bg-gray-100 dark:text-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18"
                />
              </svg>

              <span>Go back</span>
            </button>

            {/* HOME */}
            <Link
              href="/"
              className="px-5 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Take me home
            </Link>
          </div>
        </div>

        {/* RIGHT SIDE IMAGE */}
        <div className="relative w-full mt-8 lg:w-1/2 lg:mt-0">
          <img
            className="w-full h-80 md:h-96 lg:h-[32rem] rounded-lg object-cover"
            src="https://images.unsplash.com/photo-1613310023042-ad79320c00ff?auto=format&fit=crop&w=2070&q=80"
            alt="404 illustration"
          />
        </div>
      </div>
    </section>
  );
}
