'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isAuthenticated, logout, getAuthToken, getUserInitials } from '@/utils/auth';
import { useCart } from '@/contexts/CartContext';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState<'customer' | 'owner' | 'admin' | null>(null);
    const [userName, setUserName] = useState<string>('');
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const router = useRouter();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { getTotalItems } = useCart();

    useEffect(() => {
        const checkAuth = () => {
            const authToken = getAuthToken();
            console.log('Navbar auth check:', authToken);
            setIsLoggedIn(authToken !== null);
            setUserRole(authToken?.role || null);
            setUserName(authToken?.name || '');
        };

        // Initial check
        checkAuth();
        
        // Check auth status on storage change (for logout from other tabs)
        const handleStorageChange = () => {
            console.log('Storage changed, rechecking auth');
            checkAuth();
        };

        // Check on focus (when user returns to tab)
        const handleFocus = () => {
            checkAuth();
        };

        // Check periodically (every 5 seconds) for token expiration
        const interval = setInterval(checkAuth, 5000);

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('focus', handleFocus);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('focus', handleFocus);
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowProfileDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchClick = () => {
        if (isAuthenticated()) {
            router.push('/search');
        } else {
            router.push('/login');
        }
    };

    const handleLogout = () => {
        logout();
        setIsLoggedIn(false);
        setUserRole(null);
        setUserName('');
        setShowProfileDropdown(false);
    };

    return (
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 dark:bg-gray-900/80 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">T</span>
                            </div>
                            <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                                Trompo
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-8">
                            <Link
                                href="/"
                                className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200 dark:text-gray-300 dark:hover:text-blue-400"
                            >
                                Home
                            </Link>
                            <Link
                                href="/dashboard"
                                className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200 dark:text-gray-300 dark:hover:text-blue-400"
                            >
                                Dashboard
                            </Link>
                            <Link
                                href="/products"
                                className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200 dark:text-gray-300 dark:hover:text-blue-400"
                            >
                                Products
                            </Link>
                            <Link
                                href="/about"
                                className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200 dark:text-gray-300 dark:hover:text-blue-400"
                            >
                                About
                            </Link>
                        </div>
                    </div>

                    {/* Right side buttons */}
                    <div className="hidden md:block">
                        <div className="ml-4 flex items-center space-x-4">
                            <button 
                                onClick={handleSearchClick}
                                className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                            
                            {/* Cart Icon */}
                            {isLoggedIn && userRole === 'customer' && (
                                <button 
                                    onClick={() => router.push('/cart')}
                                    className="relative text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5H21M7 13v6a2 2 0 002 2h2M7 13H5.4M9 19v2m6-2v2" />
                                    </svg>
                                    {getTotalItems() > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                            {getTotalItems()}
                                        </span>
                                    )}
                                </button>
                            )}
                            {isLoggedIn ? (
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                        className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors duration-200 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700 hover:shadow-md"
                                    >
                                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 dark:from-orange-500 dark:to-red-500 rounded-full flex items-center justify-center text-white font-semibold text-sm relative">
                                            {getUserInitials(userName)}
                                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                                        </div>
                                        <span className="text-sm font-medium hidden sm:block">{userName || 'User'}</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {showProfileDropdown && (
                                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                                            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 dark:from-orange-500 dark:to-red-500 rounded-full flex items-center justify-center text-white font-semibold">
                                                        {getUserInitials(userName)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{userName || 'User'}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {userRole === 'owner' ? 'Business Owner' : userRole === 'admin' ? 'Administrator' : 'Customer'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <Link
                                                href="/dashboard"
                                                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                                                onClick={() => setShowProfileDropdown(false)}
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h2a2 2 0 012 2v2H8V5z" />
                                                    </svg>
                                                    <span>Dashboard</span>
                                                </div>
                                            </Link>
                                            
                                            <Link
                                                href="/profile"
                                                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                                                onClick={() => setShowProfileDropdown(false)}
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                    <span>Profile</span>
                                                </div>
                                            </Link>
                                            
                                            {userRole === 'customer' && (
                                                <Link
                                                    href="/cart"
                                                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                                                    onClick={() => setShowProfileDropdown(false)}
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5H21M7 13v6a2 2 0 002 2h2M7 13H5.4M9 19v2m6-2v2" />
                                                        </svg>
                                                        <span>Shopping Cart {getTotalItems() > 0 && `(${getTotalItems()})`}</span>
                                                    </div>
                                                </Link>
                                            )}
                                            
                                            <Link
                                                href="/settings"
                                                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                                                onClick={() => setShowProfileDropdown(false)}
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    <span>Settings</span>
                                                </div>
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                    </svg>
                                                    <span>Logout</span>
                                                </div>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200 dark:text-gray-300 dark:hover:text-blue-400"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        href="/signup"
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
                                    >
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                {isOpen && (
                    <div className="md:hidden">
                        <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                            <Link
                                href="/"
                                className="block text-gray-900 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 text-base font-medium rounded-lg transition-colors duration-200 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-800"
                                onClick={() => setIsOpen(false)}
                            >
                                Home
                            </Link>
                            <Link
                                href="/dashboard"
                                className="block text-gray-900 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 text-base font-medium rounded-lg transition-colors duration-200 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-800"
                                onClick={() => setIsOpen(false)}
                            >
                                Dashboard
                            </Link>
                            <Link
                                href="/products"
                                className="block text-gray-900 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 text-base font-medium rounded-lg transition-colors duration-200 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-800"
                                onClick={() => setIsOpen(false)}
                            >
                                Products
                            </Link>
                            <Link
                                href="/about"
                                className="block text-gray-900 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 text-base font-medium rounded-lg transition-colors duration-200 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-800"
                                onClick={() => setIsOpen(false)}
                            >
                                About
                            </Link>
                            <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
                                {isLoggedIn ? (
                                    <>
                                        <div className="flex items-center space-x-3 mb-3 px-3">
                                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 dark:from-orange-500 dark:to-red-500 rounded-full flex items-center justify-center text-white font-semibold">
                                                {getUserInitials(userName)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{userName}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {userRole === 'owner' ? 'Business Owner' : 'Customer'}
                                                </p>
                                            </div>
                                        </div>
                                        <Link
                                            href="/profile"
                                            className="block text-gray-900 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 text-base font-medium rounded-lg transition-colors duration-200 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-800"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            <div className="flex items-center space-x-2">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                <span>Profile</span>
                                            </div>
                                        </Link>
                                        <Link
                                            href="/settings"
                                            className="block text-gray-900 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 text-base font-medium rounded-lg transition-colors duration-200 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-800"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            <div className="flex items-center space-x-2">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span>Settings</span>
                                            </div>
                                        </Link>
                                        <button
                                            onClick={() => {
                                                handleLogout();
                                                setIsOpen(false);
                                            }}
                                            className="block w-full text-left text-red-600 hover:text-red-700 hover:bg-gray-50 px-3 py-2 text-base font-medium rounded-lg transition-colors duration-200 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-gray-800"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                                <span>Logout</span>
                                            </div>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            href="/login"
                                            className="block text-gray-900 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 text-base font-medium rounded-lg transition-colors duration-200 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-800"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            Sign In
                                        </Link>
                                        <Link
                                            href="/signup"
                                            className="block bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 mt-2 text-base font-medium rounded-lg transition-colors duration-200"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            Sign Up
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}