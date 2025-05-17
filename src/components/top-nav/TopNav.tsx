'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { navigationItems } from '@/config/navigation';
import { useAuth } from '@/contexts/auth-context';

export function TopNav() {
	const pathname = usePathname();
	const { user, isConnecting, connect, disconnect } = useAuth();
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

	const toggleMobileMenu = () => {
		setIsMobileMenuOpen(!isMobileMenuOpen);
		if (isProfileDropdownOpen) setIsProfileDropdownOpen(false);
	};

	const toggleProfileDropdown = () => {
		setIsProfileDropdownOpen(!isProfileDropdownOpen);
		if (isMobileMenuOpen) setIsMobileMenuOpen(false);
	};

	return (
		<nav className="bg-gray-800 text-white">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">
					{/* Logo/Brand */}
					<div className="flex-shrink-0">
						<Link href="/" className="text-xl font-bold">
							Logo
						</Link>
					</div>

					{/* Desktop Navigation */}
					<div className="hidden md:flex items-center space-x-4">
						{navigationItems.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className={`px-3 py-2 rounded-md text-sm font-medium transition-colors
									${pathname === item.href
										? 'bg-gray-900 text-white'
										: 'text-gray-300 hover:bg-gray-700 hover:text-white'
									}`}
							>
								{item.label}
							</Link>
						))}
					</div>

					{/* Auth Section */}
					<div className="flex items-center">
						{user ? (
							<div className="relative">
								<button
									onClick={toggleProfileDropdown}
									className="flex items-center space-x-2 focus:outline-none"
								>
									<div className="w-8 h-8 rounded-full overflow-hidden bg-gray-600">
										{user.profile?.image ? (
											<Image
												src={user.profile.image}
												alt="Profile"
												width={32}
												height={32}
												className="object-cover"
											/>
										) : (
											<div className="w-full h-full flex items-center justify-center">
												<span>👤</span>
											</div>
										)}
									</div>
								</button>

								{/* Profile Dropdown */}
								{isProfileDropdownOpen && (
									<div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
										<div className="py-1">
											<button
												onClick={() => {
													disconnect();
													setIsProfileDropdownOpen(false);
												}}
												className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
											>
												Disconnect
											</button>
										</div>
									</div>
								)}
							</div>
						) : (
							<button
								onClick={connect}
								disabled={isConnecting}
								className={`bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium
									${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
							>
								{isConnecting ? 'Connecting...' : 'Connect'}
							</button>
						)}

						{/* Mobile menu button */}
						<div className="md:hidden ml-4">
							<button
								onClick={toggleMobileMenu}
								className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
							>
								<span className="sr-only">Open main menu</span>
								<svg
									className="h-6 w-6"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d={isMobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
									/>
								</svg>
							</button>
						</div>
					</div>
				</div>

				{/* Mobile Navigation */}
				{isMobileMenuOpen && (
					<div className="md:hidden">
						<div className="px-2 pt-2 pb-3 space-y-1">
							{navigationItems.map((item) => (
								<Link
									key={item.href}
									href={item.href}
									className={`block px-3 py-2 rounded-md text-base font-medium ${
										pathname === item.href
											? 'bg-gray-900 text-white'
											: 'text-gray-300 hover:bg-gray-700 hover:text-white'
									}`}
									onClick={() => setIsMobileMenuOpen(false)}
								>
									{item.label}
								</Link>
							))}
						</div>
					</div>
				)}
			</div>
		</nav>
	);
} 