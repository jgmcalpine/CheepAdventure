'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function LandingHeader() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Left section - Header content */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-6 max-w-xl">
          <h1 className="text-4xl md:text-5xl font-bold">
            Cheep your own Adventure
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
            Create your own stories, step by step. Or follow another's rabbit hole.
          </p>
          <div className="flex gap-4">
            <Link 
              href="/read"
              className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Read
            </Link>
            <Link 
              href="/write"
              className="px-6 py-3 rounded-lg border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              Write
            </Link>
          </div>
        </div>

        {/* Right section - Image */}
        <div className="w-full md:w-1/2 relative aspect-square md:aspect-auto">
          <Image
            src="/adventure-illustration.svg"
            alt="Adventure illustration"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>
    </div>
  );
} 