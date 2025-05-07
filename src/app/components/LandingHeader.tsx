'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function LandingHeader() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Left section - Header content */}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Cheep your own Adventure
          </h1>
          <p className="text-lg md:text-xl mb-8 text-gray-600 dark:text-gray-300">
            Create your own stories, step by step. Or follow another's rabbit hole.
          </p>
          <div className="flex flex-row gap-4 justify-center md:justify-start">
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
        <div className="flex-1 relative w-full h-[300px] md:h-[400px]">
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